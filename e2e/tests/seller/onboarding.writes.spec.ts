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
  for (let step = 0; step < 30; step++) {
    if (await page.getByRole('button', { name: 'Submit application' }).isVisible()) return
    const inputs = page.locator('main input:visible, main textarea:visible, input:visible:not([placeholder^="Search"])')
    for (const input of await inputs.all()) {
      const type = await input.getAttribute('type')
      const placeholder = (await input.getAttribute('placeholder')) ?? ''
      if (type === 'checkbox' || type === 'radio' || type === 'file' || type === 'date') continue
      if ((await input.inputValue()) !== '') continue
      if (/first name/i.test(placeholder)) await input.fill('QA')
      else if (/last name/i.test(placeholder)) await input.fill('Chat Seller')
      else if (type === 'password') await input.fill(password)
      else if (type === 'email') await input.fill(email)
      else if (type === 'tel' || /mobile|09|\+63/i.test(placeholder)) await input.fill('09171234567')
      else if (/promo|code/i.test(placeholder)) continue
      else if (/landline|\(02\)/i.test(placeholder)) await input.fill('(045) 123 4567')
      else await input.fill(/address|street|city/i.test(placeholder) ? '1 Rizal St, Balibago, Angeles City, Pampanga 2009' : 'QA Shop Chat')
    }
    const org = page.getByRole('button', { name: 'Sole Proprietorship', exact: true })
    if (await org.isVisible().catch(() => false)) await org.click()
    const no = page.getByRole('button', { name: 'No', exact: true })
    if (await no.isVisible().catch(() => false)) await no.click()
    const send = page.getByRole('button', { name: /^(Send|Skip)$/ }).last()
    if (await send.isEnabled().catch(() => false)) await send.click()
    await page.waitForTimeout(1200)
  }
  throw new Error('chat never reached the review card')
}

test.describe('seller onboarding (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')
  // testseller (Vercel) is built without VITE_PUBLISHABLE_API_KEY, so sign-up fails there (F27);
  // run against a local panel on test-api: SELLER_URL=http://localhost:5173
  test.skip(!process.env.SELLER_URL, 'set SELLER_URL to a seller panel built with the publishable key')
  test.describe.configure({ mode: 'serial' })

  const email = `delivered+e2e-chat-seller-${Date.now()}@resend.dev`
  const password = `Qa-chat-${Date.now()}`

  test('SEL-01 registration chat submits an application', async ({ page }) => {
    await page.goto('/register')
    await answerChat(page, email, password)
    await expect(page.getByText(email).first()).toBeVisible()
    await page.getByRole('button', { name: 'Submit application' }).click()
    await expect(page.getByText(/application (has been )?(submitted|received)|thank you|we'll review/i).first()).toBeVisible({ timeout: 60_000 })
  })

  test('SEL-01 a pending applicant cannot reach the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.goto('/dashboard')
    await expect(page.getByText(/pending|under review|not (yet )?approved|awaiting/i).first().or(page.locator('input[name="email"]'))).toBeVisible()
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
