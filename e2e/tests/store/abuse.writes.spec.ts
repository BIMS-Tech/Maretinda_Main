import {
  addToCart,
  API_URL,
  expect,
  PUBLISHABLE_KEY,
  registerBuyer,
  sellerProducts,
  sellerToken,
  signInBuyer,
  test,
  writesAllowed,
} from '../fixtures'

/**
 * Browser abuse checks SEC-03 to SEC-05 from docs/qa-test-cases.md. SEC-01,
 * SEC-02, SEC-06 and SEC-07 are covered by CHK-07/08, CHK-13 and the backend
 * security-* suites.
 */
test.describe('abuse (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test('SEC-03 a script in a product description does not run', async ({ page, request }) => {
    const [, tote] = sellerProducts('A')
    const token = await sellerToken(request, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    const description = `Canvas tote. <img src=x onerror="window.__xss=1;alert(1)"><script>window.__xss=2</script> Sturdy.`
    const res = await request.post(`${API_URL}/vendor/products/${tote.productId}`, {
      headers: { authorization: `Bearer ${token}` },
      data: { description },
    })
    expect(res.status(), await res.text()).toBeLessThan(300)

    let dialog = false
    page.on('dialog', async (d) => { dialog = true; await d.dismiss() })
    const { product } = await (await request.get(`${API_URL}/store/products/${tote.productId}?fields=handle`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
    })).json()
    await expect(async () => {
      await page.goto(`/ph/products/${product.handle}`)
      await page.getByRole('button', { name: 'Product Details' }).click()
      await expect(page.getByText(/Sturdy/).first()).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 180_000 })
    await page.waitForTimeout(1_000)
    expect(dialog).toBe(false)
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined()
    await expect(page.getByText(/Canvas tote/).first()).toBeVisible()
  })

  test('SEC-04 login ignores a returnTo pointing at another site', async ({ page }) => {
    const buyer = await registerBuyer(page, 'sec04')
    await page.context().clearCookies()
    await page.goto('/ph/login?returnTo=https://example.com/steal')
    await page.locator('input[name="email"]').fill(buyer.email)
    await page.locator('input[name="password"]').fill(buyer.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 })
    expect(new URL(page.url()).host).toBe(new URL(page.url()).host.replace(/^example\.com$/, 'x'))
    expect(page.url()).not.toContain('example.com')
  })

  test('SEC-05 repeated wrong passwords are throttled for that account only', async ({ page, browser }) => {
    // Needs STORE_SERVER_SECRET on both the store and the backend (F47); without it
    // the backend sees the store's server address and can't tell buyers apart
    test.skip(process.env.E2E_STORE_SECRET_CONFIGURED !== '1', 'set E2E_STORE_SECRET_CONFIGURED=1 once STORE_SERVER_SECRET is on both sides')
    const victim = await registerBuyer(page, 'sec05')
    await page.context().clearCookies()
    let throttled = false
    const messages: string[] = []
    for (let attempt = 1; attempt <= 13 && !throttled; attempt++) {
      await page.goto('/ph/login')
      await page.locator('input[name="email"]').fill(victim.email)
      await page.locator('input[name="password"]').fill(`Wrong-${attempt}-pass`)
      await page.getByRole('button', { name: 'Sign in' }).click()
      // Wait for this attempt to finish before reading its message
      await expect(page.locator('input[name="password"]')).toBeEnabled({ timeout: 60_000 })
      const message = (await page.locator('[role=alert], .text-red-500, [class*=error]').allInnerTexts()).join(' ')
      messages.push(`${attempt}: ${message.replace(/\s+/g, ' ').trim()}`)
      throttled = /too many/i.test(message)
    }
    expect(throttled, messages.join('\n')).toBe(true)

    // Another account is unaffected
    const { urls } = await import('../../playwright.config')
    const other = await browser.newPage({ baseURL: urls.store })
    const friend = await registerBuyer(other, 'sec05b')
    await other.context().clearCookies()
    await signInBuyer(other, friend.email, friend.password)
    await other.close()
  })
})
