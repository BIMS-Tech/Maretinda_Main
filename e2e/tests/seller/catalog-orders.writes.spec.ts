import {
  adminToken,
  API_URL,
  apiCodOrder,
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
    await expect(row).toContainText('890.00')
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
})
