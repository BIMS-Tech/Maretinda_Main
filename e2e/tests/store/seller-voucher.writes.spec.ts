import {
  addToCart,
  API_URL,
  expect,
  peso,
  registerBuyer,
  sellerProducts,
  sellerToken,
  test,
  writesAllowed,
} from '../fixtures'

/**
 * SOP-09 and CHK-13: a seller's own voucher shows on their page and only
 * discounts their items. Seller A's voucher is made through /vendor/promotions,
 * the route the seller panel's promotion form calls.
 */
test.describe('seller voucher (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('B').length, 'set E2E_ALLOW_WRITES=1 and both sellers')
  test.describe.configure({ mode: 'serial' })

  const code = `QA10A${Date.now().toString(36).toUpperCase()}`

  test('SOP-09 a seller voucher shows on the seller page', async ({ page, request }) => {
    const token = await sellerToken(request, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    const res = await request.post(`${API_URL}/vendor/promotions`, {
      headers: { authorization: `Bearer ${token}` },
      data: {
        code,
        type: 'standard',
        status: 'active',
        is_automatic: false,
        application_method: {
          type: 'percentage',
          target_type: 'items',
          allocation: 'each',
          value: 10,
          max_quantity: 10,
          target_rules: [{ attribute: 'items.product.id', operator: 'in', values: sellerProducts('A').map((p) => p.productId) }],
        },
      },
    })
    expect(res.status(), await res.text()).toBeLessThan(300)

    await page.goto('/ph/sellers/qa-shop-a')
    await expect(page.getByText(code).first()).toBeVisible({ timeout: 60_000 })
  })

  test('CHK-13 it discounts only that seller items', async ({ page }) => {
    const [shirtA] = sellerProducts('A')
    const [, toteB] = sellerProducts('B')
    await registerBuyer(page, 'chk13')
    await addToCart(page, shirtA.productId)
    await addToCart(page, toteB.productId)
    await page.goto('/ph/cart')
    await page.getByRole('button', { name: /select or enter a voucher/i }).click()
    await page.getByRole('button', { name: 'Enter Code' }).click()
    await page.getByPlaceholder('e.g. HELLOMRTD').fill(code)
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    await expect(page.locator('[data-sonner-toast]').last()).toContainText(`${code} applied`)
    await page.goto('/ph/cart')
    const summary = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
    // 10% of seller A's ₱770 shirt; seller B's ₱444 tote untouched
    expect(summary).toMatch(/−₱77\.00/)
    expect(summary).toContain(`Total ${peso(shirtA.price + toteB.price - 77)}`)
  })
})
