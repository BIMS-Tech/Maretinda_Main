import {
  adminToken,
  API_URL,
  apiCodOrder,
  PUBLISHABLE_KEY,
  expect,
  sellerProducts,
  sellerToken,
  signInBuyer,
  signInSeller,
  test,
  writesAllowed,
} from '../fixtures'

/**
 * Seller catalog and order cases SOP-01 to SOP-10 from docs/qa-test-cases.md,
 * as seller A (E2E_SELLER_*). Orders are placed through the store API by a
 * new buyer on Resend's test inbox.
 */
test.describe('seller orders (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')
  test.describe.configure({ mode: 'serial' })

  let order: Awaited<ReturnType<typeof apiCodOrder>>

  // Medusa auto-captures the system payment at checkout and our subscriber
  // undoes it about a second later, so wait for the status to settle
  async function settledPaymentStatus(request: import('@playwright/test').APIRequestContext, orderId: string) {
    const admin = await adminToken(request)
    let status = ''
    await expect(async () => {
      const read = async () => (await (await request.get(`${API_URL}/admin/orders/${orderId}?fields=payment_status`, {
        headers: { authorization: `Bearer ${admin}` },
      })).json()).order.payment_status as string
      const first = await read()
      await new Promise((r) => setTimeout(r, 2_000))
      status = await read()
      expect(status).toBe(first)
    }).toPass({ timeout: 30_000 })
    return status
  }

  test('SOP-04 another seller cannot mark this COD order paid', async ({ request }) => {
    order = await apiCodOrder(request, sellerProducts('A')[0].variantId)
    expect(await settledPaymentStatus(request, order.orderId)).toBe('authorized')
    const tokenB = await sellerToken(request, process.env.E2E_SELLER_B_EMAIL!, process.env.E2E_SELLER_B_PASSWORD!)
    const res = await request.post(`${API_URL}/vendor/orders/${order.orderId}/capture`, {
      headers: { authorization: `Bearer ${tokenB}` },
    })
    expect(res.status()).toBe(404)
    expect(await settledPaymentStatus(request, order.orderId)).toBe('authorized')
  })

  test('SOP-02 the new order is listed, awaiting payment', async ({ page }) => {
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto('/orders')
    const row = page.getByRole('row').filter({ hasText: `#${order.displayId}` })
    await expect(row).toContainText(/awaiting/i)
    await expect(row).toContainText('770.00')
  })

  test('SOP-03 marking COD paid captures it for the seller and the admin', async ({ page, request }) => {
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto(`/orders/${order.orderId}`)
    await page.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Capture Payment' }).click()
    await expect(page.getByText('Payment captured').first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(/captured/i).first()).toBeVisible()

    expect(await settledPaymentStatus(request, order.orderId)).toBe('captured')
  })

  test('SOP-05 fulfil, ship and deliver; the buyer sees each step', async ({ page, browser }) => {
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto(`/orders/${order.orderId}`)
    await page.getByRole('button', { name: 'Fulfill items' }).click()
    await page.getByRole('button', { name: 'Create Fulfillment' }).click()
    await expect(page.getByText(/Awaiting shipping/i).first()).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'Mark as shipped' }).click()
    const shipDialog = page.getByRole('dialog')
    await expect(shipDialog.getByRole('heading', { name: 'Mark fulfillment shipped' })).toBeVisible()
    await shipDialog.getByRole('button', { name: 'Save' }).click()
    await expect(shipDialog).toHaveCount(0, { timeout: 60_000 })
    await expect(page.getByText(/Awaiting shipping/i)).toHaveCount(0, { timeout: 60_000 })

    await page.getByRole('button', { name: 'Mark as delivered' }).click()
    const confirm = page.getByRole('alertdialog')
    if (await confirm.waitFor({ timeout: 5_000 }).then(() => true, () => false)) {
      await confirm.getByRole('button').last().click()
    }
    await expect(page.getByText(/delivered/i).first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'Mark as delivered' })).toHaveCount(0)

    const { urls } = await import('../../playwright.config')
    const store = await browser.newPage({ baseURL: urls.store })
    await signInBuyer(store, order.email, order.password)
    await store.goto('/ph/user/orders')
    await expect(store.getByText(/delivered/i).first()).toBeVisible({ timeout: 60_000 })
    await store.close()
  })

  test('SOP-01 a product created in the panel reaches the store at its price', async ({ page, browser, request }) => {
    const title = `QA Panel Shirt ${Date.now()}`
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto('/products/create')
    // The create modal is mounted twice (F33); the last one is on top
    const dlg = page.locator('[role=dialog]').last()
    await dlg.locator('input[name="title"]').fill(title)
    await dlg.locator('textarea[name="description"]').fill('Created by the production-readiness test run.')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    await dlg.locator('input[type=file]').setInputFiles({ name: 'shirt.png', mimeType: 'image/png', buffer: png })
    await dlg.locator('button', { hasText: /^Continue$/ }).click()
    await dlg.locator('button', { hasText: /^Continue$/ }).click()
    // The price is a data-grid cell: select it and type, as a seller would
    const priceCell = dlg.locator('[data-container-id="0:3"]')
    await priceCell.click()
    await page.keyboard.type('555')
    await page.keyboard.press('Enter')
    // F34: the first digit used to be dropped, saving ₱55
    await expect(dlg.locator('input[name="variants.0.prices.php"]')).toHaveValue(/^555(\.00)?$/)
    await dlg.locator('button', { hasText: /^Create Product$/ }).click()
    await expect(page).toHaveURL(/\/products\/prod_/, { timeout: 60_000 })
    const productId = new URL(page.url()).pathname.split('/').pop()!

    // Proposed products are accepted automatically on test; wait until the store lists it
    let handle = ''
    await expect(async () => {
      const res = await request.get(`${API_URL}/store/products/${productId}?fields=handle,status`, {
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
      })
      expect(res.status()).toBe(200)
      handle = (await res.json()).product.handle
    }).toPass({ timeout: 120_000 })

    const { urls } = await import('../../playwright.config')
    const store = await browser.newPage({ baseURL: urls.store })
    await store.goto(`/ph/products/${handle}`)
    await expect(store.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(store.getByText('₱555.00').first()).toBeVisible()
    await store.close()
  })
})
