import { confirmBuyerEmail, expect, registerBuyer, test, writesAllowed } from '../fixtures'

/**
 * A new buyer confirms their email before ordering. The link itself can't be
 * opened from here (it goes to the inbox), so support's "mark as confirmed"
 * stands in for it.
 */
test.describe('email confirmation (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')

  test('EV-01 a new buyer is asked to confirm, can resend, and the notice goes once confirmed', async ({ page }) => {
    const buyer = await registerBuyer(page, 'verify', { confirmEmail: false })
    await page.goto('/ph/user')
    const notice = page.getByTestId('email-verification-notice')
    await expect(notice).toContainText('Please confirm your email address')
    await expect(notice).toContainText(buyer.email)
    await page.getByTestId('email-verification-resend').click()
    await expect(notice).toContainText(/We sent a new link to/, { timeout: 30_000 })

    await confirmBuyerEmail(page.request, buyer.email)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Welcome, E2E' })).toBeVisible()
    await expect(page.getByTestId('email-verification-notice')).toHaveCount(0)
  })

  test('EV-02 a broken confirmation link says so', async ({ page }) => {
    await page.goto('/ph/verify-email?token=not-a-real-link')
    await expect(page.getByTestId('verify-email-failed')).toContainText("isn't valid", { timeout: 30_000 })
  })
})
