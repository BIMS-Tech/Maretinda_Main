import { expect, expectNoErrorBoundary, test } from '../fixtures'

const sellerEmail = process.env.E2E_SELLER_EMAIL
const sellerPassword = process.env.E2E_SELLER_PASSWORD

test.describe('seller panel (read-only)', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('login rejects wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(`nobody-${Date.now()}@example.invalid`)
    await page.locator('input[name="password"]').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong|unauthorized|not found/i).first()).toBeVisible()
  })

  test('registration form renders', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/selling on/i)
    await expect(page.getByPlaceholder('First name')).toBeVisible()
    await expect(page.getByPlaceholder('Last name')).toBeVisible()
  })

  test('unauthenticated visitors are sent to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('seller panel (signed in)', () => {
  test.skip(!sellerEmail || !sellerPassword, 'set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD')

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(sellerEmail!)
    await page.locator('input[name="password"]').fill(sellerPassword!)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).not.toHaveURL(/\/login/)
  })

  for (const path of ['/dashboard', '/orders', '/products', '/subscription', '/giyapay', '/reels', '/messages']) {
    test(`${path} loads`, async ({ page, pageErrors }) => {
      await page.goto(path)
      await expect(page).not.toHaveURL(/\/login/)
      // Messages keeps a live chat stream open, so the network never goes idle
      await page.waitForLoadState('load')
      await page.locator('main').first().waitFor()
      await expectNoErrorBoundary(page)
      expect(pageErrors).toEqual([])
    })
  }
})
