import { apiCodOrder, expect, sellerProducts, signInBuyer, signInSeller, test, writesAllowed } from '../fixtures'

/** CHK-15 and SOP-11: a buyer asks to return a delivered item and the seller sees the request. */
test.describe('returns (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test('CHK-15 / SOP-11 a return request on a delivered order reaches the seller', async ({ page, browser, request }) => {
    test.setTimeout(600_000)
    const order = await apiCodOrder(request, sellerProducts('A')[0].variantId)

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

    const { urls } = await import('../../playwright.config')
    const store = await browser.newPage({ baseURL: urls.store })
    await signInBuyer(store, order.email, order.password)
    await store.goto('/ph/user/orders')
    await store.getByRole('link', { name: 'View Order' }).first().click()
    await expect(store).toHaveURL(/\/user\/orders\/ordset_/)
    console.log('ORDER PAGE', store.url(), JSON.stringify((await store.locator('main').getByRole('link').allInnerTexts()).slice(0, 15)), JSON.stringify((await store.locator('main').getByRole('button').allInnerTexts()).slice(0, 15)))
    await store.locator('main').getByRole('button', { name: 'Return', exact: true }).click()
    await expect(store).toHaveURL(/\/return/, { timeout: 60_000 })
    const main = store.locator('main')
    await main.locator('input[type=checkbox]').first().check()
    await main.getByRole('button', { name: 'Select Reason' }).click()
    await store.getByText('Wrong product', { exact: true }).last().click()
    await main.getByRole('button', { name: /continue/i }).click()
    // Needs a return shipping option on the seller (F44); QA seller A has one
    await main.getByText('Return to QA Shop A').first().click()
    await main.getByRole('button', { name: /request return|submit|confirm/i }).last().click()
    await expect(store).toHaveURL(/request-success/, { timeout: 60_000 })
    await store.close()

    await page.goto('/requests/orders')
    console.log('REQUESTS', (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 600))
    await expect(page.getByText(/pending/i).first()).toBeVisible({ timeout: 60_000 })
  })
})
