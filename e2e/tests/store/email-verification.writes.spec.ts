import { confirmBuyerEmail, expect, registerBuyer, test, writesAllowed } from '../fixtures'

/**
 * A new buyer confirms their email before ordering. The link itself can't be
 * opened from here (it goes to the inbox), so support's "mark as confirmed"
 * stands in for it.
 */
test.describe('email confirmation (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')

  test('EV-01 a new buyer is asked to confirm, can resend, and the notice goes once confirmed elsewhere', async ({ page }) => {
    const buyer = await registerBuyer(page, 'verify', { confirmEmail: false })
    await page.goto('/ph/user')
    const notice = page.getByTestId('email-verification-notice')
    await expect(notice).toContainText('Please confirm your email address')
    await expect(notice).toContainText(buyer.email)
    await page.getByTestId('email-verification-resend').click()
    await expect(notice).toContainText(/We sent a new link to/, { timeout: 30_000 })

    // Not confirmed yet: checking says so
    await notice.getByRole('button', { name: "I've confirmed it" }).click()
    await expect(notice).toContainText("It isn't confirmed yet", { timeout: 30_000 })

    // Confirmed somewhere else (another browser or phone): this page catches up by itself
    await confirmBuyerEmail(page.request, buyer.email)
    await expect(page.getByTestId('email-verification-confirmed')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('email-verification-notice')).toHaveCount(0)
    await expect(page.getByTestId('email-verification-confirmed')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Welcome, E2E' })).toBeVisible()
  })

  test('EV-02 a broken confirmation link says so', async ({ page }) => {
    await page.goto('/ph/verify-email?token=not-a-real-link')
    await expect(page.getByTestId('verify-email-failed')).toContainText("isn't valid", { timeout: 30_000 })
  })
})
