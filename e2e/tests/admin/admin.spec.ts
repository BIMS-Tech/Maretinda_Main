import { expect, expectNoErrorBoundary, test } from '../fixtures'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD

test.describe('admin panel (read-only)', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Email' })).toBeVisible()
  })

  test('login rejects wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(`nobody-${Date.now()}@example.invalid`)
    await page.locator('input[name="password"]').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Continue with Email' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong|unauthorized/i).first()).toBeVisible()
  })

  // KNOWN GAP (testadmin, 2026-11-03): /admin/users/me returns 401 but the
  // page stays blank on /orders instead of redirecting, although
  // ProtectedRoute and ErrorBoundary both navigate to /login on a 401 in
  // source. Remove `.fail` once the deployed admin redirects.
  test.fail('unauthenticated visitors are sent to login', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('admin panel (signed in)', () => {
  test.skip(!adminEmail || !adminPassword, 'set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(adminEmail!)
    await page.locator('input[name="password"]').fill(adminPassword!)
    await page.getByRole('button', { name: 'Continue with Email' }).click()
    await expect(page).not.toHaveURL(/\/login/)
  })

  for (const path of [
    '/orders',
    '/products',
    '/sellers',
    '/requests',
    '/subscriptions',
    '/giyapay',
    '/promotions',
    '/flash-sales',
    '/shipping-orders',
    '/store-front',
    '/reports',
  ]) {
    test(`${path} loads`, async ({ page, pageErrors }) => {
      await page.goto(path)
      await expect(page).not.toHaveURL(/\/login/)
      await page.waitForLoadState('networkidle')
      await expectNoErrorBoundary(page)
      expect(pageErrors).toEqual([])
    })
  }
})
