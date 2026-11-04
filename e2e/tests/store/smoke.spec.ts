import { expect, expectNoErrorBoundary, test } from '../fixtures'

/** Read-only storefront checks: safe to run against any environment. */

test.describe('storefront (read-only)', () => {
  test('redirects the bare domain to the PH locale', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/ph\/?$/)
  })

  test('home page renders its main sections without crashing', async ({ page, pageErrors }) => {
    await page.goto('/ph')
    await expect(page).toHaveTitle(/Maretinda/)
    await expect(page.getByRole('heading', { name: /Shop by category/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Trending in the Philippines/i })).toBeVisible()
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
    await expectNoErrorBoundary(page)
    expect(pageErrors).toEqual([])
  })

  test('product page shows price, add to cart and every tab', async ({ page, pageErrors }) => {
    await page.goto('/ph')
    const firstProduct = page.locator('a[href*="/products/"]').first()
    const href = await firstProduct.getAttribute('href')
    await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/₱\s?[\d,]+/).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible()

    for (const tab of ['Product Details', 'Ratings & Reviews', 'Shipping & Returns']) {
      await page.getByRole('button', { name: tab }).click()
      await expectNoErrorBoundary(page)
    }
    expect(pageErrors).toEqual([])
  })

  test('share menu leads with Copy link', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mobile uses the OS share sheet instead of the menu')
    await page.goto('/ph')
    const href = await page.locator('a[href*="/products/"]').first().getAttribute('href')
    await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)

    await page.getByRole('button', { name: /^Share / }).click()
    await expect(page.getByRole('menuitem').or(page.getByRole('button')).filter({ hasText: /copy link/i }).first()).toBeVisible()
  })

  test('search submits to the category listing with the query', async ({ page }) => {
    await page.goto('/ph')
    const search = page.getByPlaceholder('Search for products...').locator('visible=true').first()
    await search.fill('shirt')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/categories\?query=shirt/)
    await expectNoErrorBoundary(page)
  })

  test('category listing shows products', async ({ page }) => {
    await page.goto('/ph/categories')
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
  })

  test('anonymous cart asks the shopper to log in to check out', async ({ page }) => {
    await page.goto('/ph/cart')
    await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login to checkout' })).toBeVisible()
  })

  test('login rejects a wrong password', async ({ page }) => {
    await page.goto('/ph/login')
    await page.locator('input[name="email"]').fill(`nobody-${Date.now()}@example.invalid`)
    await page.locator('input[name="password"]').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong|not found|failed/i).first()).toBeVisible()
  })

  test.describe('static pages', () => {
    for (const [path, heading] of [
      ['/ph/help-center', /How can we help you/i],
      ['/ph/sellers', /seller|shop/i],
      ['/ph/vouchers', /voucher/i],
      ['/ph/flash-sale', /flash/i],
      ['/ph/privacy', /privacy/i],
      ['/ph/terms', /terms/i],
    ] as const) {
      test(`${path} loads`, async ({ page, pageErrors }) => {
        const res = await page.goto(path)
        expect(res?.status()).toBeLessThan(400)
        await expect(page.getByRole('heading').filter({ hasText: heading }).first()).toBeVisible()
        expect(pageErrors).toEqual([])
      })
    }
  })
})

test.describe('storefront links', () => {
  test('every internal link on the home page resolves', async ({ page, request, baseURL }) => {
    await page.goto('/ph')
    const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')!))
    const unique = [...new Set(hrefs.map((h) => h.split('#')[0]).filter(Boolean))]

    const broken: string[] = []
    for (const href of unique) {
      const res = await request.get(new URL(href, baseURL).toString(), { maxRedirects: 5, timeout: 120_000 })
      if (res.status() >= 400) broken.push(`${href} → ${res.status()}`)
    }
    expect(broken).toEqual([])
  })

})
