import type { Page } from '@playwright/test'

import { urls } from '../../playwright.config'
import { adminPage, adminToken, API_URL, expect, test, writesAllowed } from '../fixtures'

/**
 * Seller onboarding SEL-01 to SEL-03 through the seller panel's chat-style
 * registration. Applications go to Resend's test inbox. Approval (SEL-02)
 * is done in the admin panel by admin.spec.ts's onboarding case, which
 * reads the email this spec writes to test-results.
 */

/** Answers the onboarding chat one question at a time until the review card. */
async function answerChat(page: Page, email: string, password: string) {
  const byPlaceholder: [RegExp, string][] = [
    [/first name/i, 'QA'],
    [/last name/i, 'Chat Seller'],
    [/^0917/, '09171234567'],
    [/@example\.com/, email],
    [/juan's/i, 'QA Chat Trading'],
    [/^shop name$/i, 'QA Shop Chat'],
    [/123-456-789/, '123456789000'],
    [/barangay/i, 'Balibago'],
    [/zip/i, '2009'],
    [/house|street/i, '1 Rizal St'],
    [/general manager/i, 'Owner'],
  ]
  const choices = ['Sole proprietor (DTI)', 'Non-VAT', '11–50', 'I make them myself', 'No']
  for (let step = 0; step < 40; step++) {
    if (await page.getByRole('button', { name: 'Submit application' }).isVisible()) {
      for (const box of await page.locator('input[type="checkbox"]').all()) await box.check()
      return
    }
    const province = page.getByLabel('Province')
    if (await province.isVisible().catch(() => false)) {
      await province.selectOption('Pampanga')
      await page.getByLabel('City or municipality').selectOption('Angeles City')
    }
    for (const input of await page.locator('input:visible').all()) {
      const type = await input.getAttribute('type')
      const placeholder = (await input.getAttribute('placeholder')) ?? ''
      if (type === 'checkbox' || type === 'file' || (await input.inputValue()) !== '') continue
      if (type === 'password') await input.fill(password)
      else {
        const hit = byPlaceholder.find(([re]) => re.test(placeholder))
        if (hit) await input.fill(hit[1])
      }
    }
    let clicked = false
    for (const label of choices) {
      const button = page.getByRole('button', { name: label, exact: true })
      if (await button.isVisible().catch(() => false)) {
        await button.click()
        clicked = true
        break
      }
    }
    // "What do you mainly sell?" lists the shop's live categories
    if (!clicked && (await page.getByText('What do you mainly sell?').last().isVisible().catch(() => false))) {
      const other = page.getByRole('button', { name: 'Other', exact: true })
      if (await other.isVisible().catch(() => false)) {
        await other.click()
        clicked = true
      }
    }
    if (!clicked) {
      const send = page.getByRole('button', { name: /^(Send|Skip)$/ }).last()
      if (await send.isEnabled().catch(() => false)) await send.click()
    }
    await page.waitForTimeout(1200)
  }
  throw new Error('chat never reached the review card')
}

test.describe('seller onboarding (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')
  test.describe.configure({ mode: 'serial' })

  const email = `delivered+e2e-chat-seller-${Date.now()}@resend.dev`
  const password = `Qa-chat-${Date.now()}`

  test('SEL-01 registration chat submits an application', async ({ page }) => {
    await page.goto('/register')
    await answerChat(page, email, password)
    await expect(page.getByText(email).first()).toBeVisible()
    await page.getByRole('button', { name: 'Submit application' }).click()
    await expect(page.getByText(/application sent|under review/i).first()).toBeVisible({ timeout: 60_000 })
  })

  test('SEL-01 a pending applicant cannot reach the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Not the dashboard and not a blank page: a screen saying the application is under review
    await expect(page).toHaveURL(/\/application-status/, { timeout: 60_000 })
    await expect(page.getByRole('heading', { name: 'Your application is under review' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(email).first()).toBeVisible()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/application-status/, { timeout: 60_000 })
    await expect(page.getByRole('link', { name: 'Orders' })).toHaveCount(0)
  })

  test('SEL-02 admin approval lets the seller in', async ({ page, browser }) => {
    const admin = await adminPage(browser)
    await admin.goto('/requests/seller')
    await admin.getByRole('row').filter({ hasText: email }).getByRole('button', { name: 'Review' }).click()
    await admin.getByRole('button', { name: 'Approve', exact: true }).click()
    // The review dialog closes only when approval succeeds; errors show inside it
    await expect(admin.getByRole('button', { name: 'Approve', exact: true })).toHaveCount(0, { timeout: 60_000 })
    await admin.close()

    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    // A real seller lands on the plans page and stays signed in
    await expect(page.getByRole('heading', { name: 'Choose a Plan' })).toBeVisible({ timeout: 60_000 })
    await page.waitForTimeout(5_000)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('SEL-04 business verification goes to Pending review', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Nothing but Subscription is reachable without a plan
    await expect(page.getByRole('heading', { name: 'Choose a Plan' })).toBeVisible({ timeout: 60_000 })
    const starter = page.getByRole('heading', { name: 'Starter', exact: true }).locator('xpath=ancestor::*[.//button][1]')
    await starter.getByRole('button', { name: /free (trial|month)/i }).click()
    await page.getByRole('button', { name: 'Start Free Trial', exact: true }).click()
    await expect(page.getByText(/Expires on/i).first()).toBeVisible({ timeout: 30_000 })

    await page.goto('/settings/store/verification')
    await page.locator('input[name="tax_id"]').fill('123-456-789-000')
    // A real 1x1 PNG, so the upload's content sniffing accepts it
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    const files = page.locator('input[type=file]')
    const count = await files.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) {
      const uploaded = page.waitForResponse((r) => /upload/.test(r.url()) && r.request().method() === 'POST', { timeout: 60_000 })
      await files.nth(i).setInputFiles({ name: `doc-${i}.png`, mimeType: 'image/png', buffer: png })
      const res = await uploaded
      expect(res.status(), `upload ${i}: ${await res.text().catch(() => '')}`).toBeLessThan(300)
    }
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/settings\/store$/, { timeout: 60_000 })
    await expect(page.getByText(/pending review/i).first()).toBeVisible()
  })

  async function reviewVerification(admin: import('@playwright/test').Page, decision: 'Reject' | 'Approve') {
    await admin.goto('/requests/seller-verification')
    await admin.getByRole('button', { name: 'All', exact: true }).click()
    await admin.getByRole('row').filter({ hasText: email }).getByRole('button', { name: 'Review' }).click()
    const drawer = admin.getByRole('dialog')
    await drawer.getByRole('button', { name: decision, exact: true }).click()
    // The drawer closes once the decision is saved; errors show inside it
    await expect(drawer).toHaveCount(0, { timeout: 60_000 })
  }

  test('SEL-06 rejected, then resubmitted, goes back to Pending review', async ({ page, browser }) => {
    const admin = await adminPage(browser)
    await reviewVerification(admin, 'Reject')
    await admin.close()

    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 })
    await page.goto('/settings/store')
    await expect(page.getByText(/rejected/i).first()).toBeVisible()

    await page.goto('/settings/store/verification')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    const uploaded = page.waitForResponse((r) => /upload/.test(r.url()) && r.request().method() === 'POST', { timeout: 60_000 })
    await page.locator('input[type=file]').last().setInputFiles({ name: 'id-fixed.png', mimeType: 'image/png', buffer: png })
    expect((await uploaded).status()).toBeLessThan(300)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/settings\/store$/, { timeout: 60_000 })
    await expect(page.getByText(/pending review/i).first()).toBeVisible()
  })

  test('SEL-05 verified sellers show the badge, and keep it after editing', async ({ page, browser }) => {
    const admin = await adminPage(browser)
    await reviewVerification(admin, 'Approve')
    await admin.close()

    const token = await adminToken(page.request)
    const { sellers } = await (await page.request.get(`${API_URL}/admin/sellers?limit=200&order=-created_at&fields=id,handle,email`, {
      headers: { authorization: `Bearer ${token}` },
    })).json()
    const handle = sellers.find((s: { email: string }) => s.email === email)?.handle
    expect(handle, 'seller handle from the admin API').toBeTruthy()
    const store = await browser.newPage({ baseURL: urls.store })
    await store.goto(`/ph/sellers/${handle}`)
    await expect(store.getByRole('img', { name: 'Verified seller' }).first()).toBeVisible()

    // Editing the store as the seller must not drop the badge
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 })
    await page.goto('/settings/store')
    await expect(page.getByText(/^verified$/i).first()).toBeVisible()
    await page.goto('/settings/store/verification')
    await page.locator('input[name="tax_id"]').fill('123-456-789-001')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/settings\/store$/, { timeout: 60_000 })
    await expect(page.getByText(/^verified$/i).first()).toBeVisible()
    await store.reload()
    await expect(store.getByRole('img', { name: 'Verified seller' }).first()).toBeVisible()
    await store.close()
  })

  test('SEL-03 wrong password stays on login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(process.env.E2E_SELLER_EMAIL!)
    await page.locator('input[name="password"]').fill('Not-the-password-1')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong|unauthorized/i).first()).toBeVisible()
  })
})
