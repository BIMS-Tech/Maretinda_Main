import { adminToken, API_URL, expect, peso, sellerProducts, sellerToken, test, writesAllowed } from '../fixtures'

/**
 * SOP-08: an admin runs a flash sale, a seller enters a product, the admin
 * approves it and the storefront shows the sale price only while it runs.
 * Uses the admin and vendor routes the two panels call.
 */
test.describe('flash sale (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test('SOP-08 an approved item sells at the flash price during the sale', async ({ request, browser }) => {
    test.setTimeout(900_000)
    const admin = { authorization: `Bearer ${await adminToken(request)}` }
    const seller = { authorization: `Bearer ${await sellerToken(request, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)}` }
    const [, tote] = sellerProducts('A')

    const now = Date.now()
    const created = await request.post(`${API_URL}/admin/flash-sales`, {
      headers: admin,
      data: { title: `QA flash sale ${now}`, starts_at: new Date(now - 60_000).toISOString(), ends_at: new Date(now + 2 * 3600_000).toISOString() },
    })
    expect(created.status(), await created.text()).toBeLessThan(300)
    const sale = (await created.json()).flash_sale
    const published = await request.post(`${API_URL}/admin/flash-sales/${sale.id}/publish`, { headers: admin })
    expect(published.status(), await published.text()).toBeLessThan(300)
    expect((await published.json()).flash_sale.status).toBe('active')

    const applied = await request.post(`${API_URL}/vendor/flash-sales/${sale.id}/items`, {
      headers: seller,
      data: { product_id: tote.productId, variant_id: tote.variantId, discount_type: 'percentage', discount_value: 25, stock_limit: 5 },
    })
    expect(applied.status(), await applied.text()).toBeLessThan(300)
    const item = (await applied.json()).item
    const approved = await request.put(`${API_URL}/admin/flash-sales/${sale.id}/items/${item.id}`, { headers: admin, data: { action: 'approve' } })
    expect(approved.status(), await approved.text()).toBeLessThan(300)

    // ₱444 less 25% is ₱333
    const salePrice = tote.price * 0.75
    const { urls } = await import('../../playwright.config')
    const store = await browser.newPage({ baseURL: urls.store })
    await expect(async () => {
      await store.goto('/ph/flash-sale')
      await expect(store.getByText(peso(salePrice)).or(store.getByText(`₱${salePrice}`)).first()).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 180_000 })

    const { product } = await (await request.get(`${API_URL}/store/products/${tote.productId}?fields=handle`, {
      headers: { 'x-publishable-api-key': 'pk_5d82a686fb7066bf78c6f23c1910f2f279d818dddf4fe349e04e266508a95b27' },
    })).json()
    await store.goto(`/ph/products/${product.handle}`)
    await expect(store.getByText(new RegExp(`₱${salePrice}(\\.00)?\\b`)).first()).toBeVisible()
    await expect(store.getByText(peso(tote.price)).first()).toBeVisible()

    // End it so the price goes back, as it would after the window. The page
    // kept the sale price for 3-10 minutes on test (F36); checkout refuses it.
    expect((await request.post(`${API_URL}/admin/flash-sales/${sale.id}/end`, { headers: admin })).status()).toBeLessThan(300)
    await expect(async () => {
      await store.goto(`/ph/products/${product.handle}`)
      await expect(store.getByText(new RegExp(`₱${salePrice}(\\.00)?\\b`))).toHaveCount(0, { timeout: 5_000 })
    }).toPass({ timeout: 600_000 })
    await store.close()
  })
})
