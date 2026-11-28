import { adminPage, apiCodOrder, expect, sellerProducts, signInBuyer, signInSeller, test, writesAllowed } from '../fixtures'

// A real (tiny) PNG: the evidence and receipt uploads check the file's signature
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

/**
 * CHK-15 / SOP-11 / RET-01: the return and refund policy end to end. A buyer
 * asks for a refund on a delivered item with a photo and a GCash account, the
 * seller refunds without a return, accounting logs the transfer with its
 * reference and receipt, and the buyer sees the reference on the order.
 */
test.describe('returns (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test('CHK-15 / SOP-11 / RET-01 return with proof → seller refunds → accounting logs the transfer', async ({ page, browser, request }) => {
    test.setTimeout(600_000)
    const order = await apiCodOrder(request, sellerProducts('A')[0].variantId)

    // The seller ships and delivers it
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto(`/orders/${order.orderId}`)
    await page.getByRole('button', { name: 'Fulfill items' }).click()
    await page.getByRole('button', { name: 'Create Fulfillment' }).click()
    await expect(page.getByText(/Awaiting shipping/i).first()).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Mark as shipped' }).click()
    const ship = page.getByRole('dialog')
    await ship.getByRole('button', { name: 'Save' }).click()
    await expect(ship).toHaveCount(0, { timeout: 60_000 })
    await page.getByRole('button', { name: 'Mark as delivered' }).click()
    const confirm = page.getByRole('alertdialog')
    if (await confirm.waitFor({ timeout: 5_000 }).then(() => true, () => false)) await confirm.getByRole('button').last().click()
    await expect(page.getByRole('button', { name: 'Mark as delivered' })).toHaveCount(0, { timeout: 60_000 })

    // The buyer asks for a refund: item and reason, then a photo and where to send the money
    const { urls } = await import('../../playwright.config')
    const store = await browser.newPage({ baseURL: urls.store })
    await signInBuyer(store, order.email, order.password)
    await store.goto('/ph/user/orders')
    await store.getByRole('link', { name: 'View Order' }).first().click()
    await expect(store).toHaveURL(/\/user\/orders\/ordset_/)
    const orderPage = store.url()
    await store.locator('main').getByRole('link', { name: 'Ask for a return' }).click()
    const form = store.getByTestId('return-form')
    await expect(form).toBeVisible({ timeout: 60_000 })
    const formUrl = store.url()
    await form.locator('input[type=checkbox]').first().check()
    await form.locator('select[aria-label^="Reason for"]').first().selectOption('wrong-item')
    await form.getByRole('button', { name: 'Continue' }).click()
    await expect(form).toHaveAttribute('data-step', '2')
    await form.getByTestId('evidence-uploader').locator('input[type=file]').setInputFiles({ name: 'wrong-item.png', mimeType: 'image/png', buffer: PNG })
    await expect(form.getByText('wrong-item.png')).toBeVisible({ timeout: 60_000 })
    const account = form.getByTestId('refund-account')
    await account.getByText('GCash', { exact: true }).click()
    await account.getByPlaceholder('As it appears on the account').fill('API Buyer')
    await account.getByPlaceholder('0917 123 4567').fill('09171234567')
    await form.getByText(/The item is unused/).click()
    await form.getByTestId('return-submit').click()
    await expect(store).toHaveURL(/request-success/, { timeout: 60_000 })
    const requestId = store.url().match(/orders\/([^/]+)\/request-success/)![1]

    // Asking again (the back button, a second tab) finds the first request instead of a new form
    await store.goto(formUrl)
    const already = store.getByTestId('return-already-asked')
    await expect(already).toBeVisible({ timeout: 60_000 })
    await expect(already.getByRole('link', { name: 'Follow your return' })).toHaveAttribute('href', new RegExp(`return=${requestId}`))
    await store.goto(orderPage)
    await expect(store.getByTestId('return-requested')).toHaveAttribute('data-open', 'true', { timeout: 60_000 })

    // The seller sees the proof and refunds without a return
    await page.goto(`/requests/orders/${requestId}/review`)
    const drawer = page.getByTestId('return-case')
    await expect(drawer).toHaveAttribute('data-stage', 'seller_review', { timeout: 60_000 })
    await expect(drawer.getByRole('img', { name: "Buyer's photo" })).toBeVisible({ timeout: 60_000 })
    await drawer.getByRole('button', { name: 'Refund without a return' }).click()
    await drawer.getByTestId('return-send').click()
    await expect(drawer).toHaveAttribute('data-stage', 'refund_due', { timeout: 60_000 })

    // Accounting sends it and logs the transfer
    const admin = await adminPage(browser)
    await admin.goto('/returns')
    await admin.getByRole('tab', { name: /Refunds to send/ }).click()
    const row = admin.getByRole('row').filter({ hasText: `#${order.displayId}` })
    await expect(row).toBeVisible({ timeout: 60_000 })
    await expect(row).toContainText('GCash •••• 4567')
    await row.getByRole('button', { name: 'Mark as sent' }).click()
    const paid = admin.getByRole('dialog')
    await expect(paid.getByTestId('refund-account')).toContainText('09171234567')
    const reference = `E2E${Date.now()}`
    await paid.getByLabel('Reference number').fill(reference)
    await paid.locator('input[type=file]').setInputFiles({ name: 'receipt.png', mimeType: 'image/png', buffer: PNG })
    await expect(paid.getByText('receipt.png attached')).toBeVisible({ timeout: 60_000 })
    await paid.getByRole('button', { name: 'Log as sent' }).click()
    await expect(paid).toHaveCount(0, { timeout: 60_000 })
    await admin.getByRole('tab', { name: 'Refunds sent' }).click()
    await expect(admin.getByRole('row').filter({ hasText: reference })).toBeVisible({ timeout: 60_000 })
    await admin.context().close()

    // The order shows the return, and its refund's reference once sent
    await store.goto(orderPage)
    await expect(store.getByTestId('return-requested')).toBeVisible({ timeout: 60_000 })
    await expect(store.getByTestId('order-refunds')).toContainText(`Reference number: ${reference}`, { timeout: 60_000 })
    await store.close()
  })
})
