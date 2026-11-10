import { adminPage, expect, signInSeller, test } from '../fixtures'

/** Read-only gap cases added 2026-11-09: payout views (SOP-12, ADM-07). The panel's /payouts route is unrouted; sellers see earnings under GiyaPay. */
test.describe('seller and admin gaps (read-only)', () => {
  test('SOP-12 the seller GiyaPay earnings page loads', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto('/giyapay')
    await expect(page).not.toHaveURL(/login|subscription/)
    await expect(page.getByText(/404/)).toHaveCount(0)
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)
    console.log('PAYOUTS', (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 400))
    expect(errors).toEqual([])
  })

  test('ADM-07 the admin GiyaPay transactions page loads', async ({ browser }) => {
    const page = await adminPage(browser)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/giyapay')
    await expect(page.getByRole('heading', { name: 'Payment Gateway Settings' })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)
    console.log('GIYAPAY', (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 400))
    expect(errors).toEqual([])
    await page.context().close()
  })
})
