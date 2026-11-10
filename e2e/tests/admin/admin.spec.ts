import { adminPage, apiCodOrder, expect, expectNoErrorBoundary, sellerProducts, test, writesAllowed } from '../fixtures'

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

  test('unauthenticated visitors are sent to login', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('admin panel (signed in)', () => {
  test.skip(!adminEmail || !adminPassword, 'set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD')

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
    test(`${path} loads`, async ({ browser }) => {
      // One cached sign-in for the whole run: admin sign-ins are rate limited
      const page = await adminPage(browser)
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(path)
      await expect(page).not.toHaveURL(/\/login/)
      await page.waitForLoadState('networkidle')
      await expectNoErrorBoundary(page)
      expect(errors).toEqual([])
      await page.context().close()
    })
  }

  test('ADM-02 a new COD order is listed as Authorized', async ({ browser, request }) => {
    test.skip(!writesAllowed || !sellerProducts('A').length, 'needs E2E_ALLOW_WRITES=1 and seller A')
    const order = await apiCodOrder(request, sellerProducts('A')[0].variantId)
    const page = await adminPage(browser)
    await page.goto('/orders')
    const row = page.getByRole('row').filter({ hasText: `#${order.displayId}` })
    // COD stays authorized until the seller collects the cash (about 1s of "captured" right after checkout, F32)
    await expect(async () => {
      await page.reload()
      await expect(row).toContainText(/authorized/i, { timeout: 5_000 })
    }).toPass({ timeout: 60_000 })
    await expect(row).toContainText('890.00')
    await page.context().close()
  })
})
