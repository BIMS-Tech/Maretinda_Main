import { expect, expectNoErrorBoundary, test } from '../fixtures'

/**
 * Browsing cases BRW-01 to BRW-13 from docs/qa-test-cases.md. Read-only, so
 * safe on any environment. Seller A's ₱770 product (E2E_SELLER_PRODUCTS)
 * pins exact prices when it's set.
 */

const sellerProduct = process.env.E2E_SELLER_PRODUCTS?.split(',')[0]?.split(':')

async function openFirstProduct(page: import('@playwright/test').Page) {
  await page.goto('/ph')
  const href = await page.locator('a[href*="/products/"]').first().getAttribute('href')
  await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)
}

const peso = (text: string) => Number(text.replace(/[^\d.]/g, ''))

test.describe('browsing (read-only)', () => {
  test('BRW-01 home page sections', async ({ page, pageErrors }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/ph\/?$/)
    for (const name of ['Shop by category', 'Trending in the Philippines', 'Reels', 'Featured collections', 'Top local sellers']) {
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    }
    await expectNoErrorBoundary(page)
    expect(pageErrors).toEqual([])
  })

  test('BRW-01 newsletter offer matches the HELLOMRTD voucher', async ({ page }) => {
    await page.goto('/ph')
    // HELLOMRTD is ₱200 off a first order over ₱1,500, as the hero card says
    await expect(page.getByRole('heading', { name: /₱200 off your first order over ₱1,500/ })).toBeVisible()
    // Only the newsletter block: products elsewhere can be legitimately ₱100 off
    await expect(page.locator('section', { hasText: 'Stay in the loop' }).getByText(/₱100/)).toHaveCount(0)
  })

  test('BRW-02 search lists matching products', async ({ page }) => {
    await page.goto('/ph')
    const search = page.getByPlaceholder('Search for products...').locator('visible=true').first()
    await search.fill('shirt')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/categories\?query=shirt/)
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
  })

  test('BRW-03 product page shows the exact price', async ({ page, request, pageErrors }) => {
    test.skip(!sellerProduct, 'set E2E_SELLER_PRODUCTS')
    const [productId, , price] = sellerProduct!
    const res = await request.get(`${process.env.API_URL ?? 'https://test-api.maretinda.com'}/store/products/${productId}?fields=handle`, {
      headers: { 'x-publishable-api-key': 'pk_5d82a686fb7066bf78c6f23c1910f2f279d818dddf4fe349e04e266508a95b27' },
    })
    const { product } = await res.json()
    await page.goto(`/ph/products/${product.handle}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(`₱${Number(price).toLocaleString('en-PH')}.00`).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible()
    expect(pageErrors).toEqual([])
  })

  test('BRW-04 product tabs open without crashing', async ({ page, pageErrors }) => {
    await openFirstProduct(page)
    for (const tab of ['Product Details', 'Ratings & Reviews', 'Shipping & Returns']) {
      await page.getByRole('button', { name: tab }).click()
      await expectNoErrorBoundary(page)
    }
    expect(pageErrors).toEqual([])
  })

  test('BRW-05 flash sale price matches the product page', async ({ page }) => {
    await page.goto('/ph/flash-sale')
    const card = page.locator('a[href*="/products/"]').first()
    test.skip((await card.count()) === 0, 'no product in a live flash sale')
    const cardPrices = (await card.innerText()).match(/₱[\d,.]+/g) ?? []
    const href = await card.getAttribute('href')
    await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)
    const pagePrices = (await page.locator('main').innerText()).match(/₱[\d,.]+/g) ?? []
    expect(cardPrices.length).toBeGreaterThan(0)
    // The sale price on the card appears on the product page too
    expect(pagePrices.map(peso)).toContain(peso(cardPrices[0]))
  })

  test('BRW-06 share menu leads with Copy link', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mobile uses the OS share sheet instead of the menu')
    await openFirstProduct(page)
    await page.getByRole('button', { name: /^Share / }).click()
    const items = page.getByRole('menuitem')
    await expect(items.first()).toHaveText(/copy link/i)
  })

  test('BRW-07 seller page loads its tabs', async ({ page, pageErrors }) => {
    await page.goto('/ph')
    await page.getByRole('heading', { name: 'Top local sellers' }).scrollIntoViewIfNeeded()
    await page.locator('a[href*="/sellers/"]').filter({ hasText: /IBITA Fashion/ }).first().click()
    await expect(page).toHaveURL(/\/sellers\//)
    await expect(page.getByRole('heading', { name: 'IBITA Fashion' }).first()).toBeVisible()
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
    await expectNoErrorBoundary(page)
    expect(pageErrors).toEqual([])
  })

  test('BRW-08 price sorting orders by cheapest variant', async ({ page }) => {
    // Known bug: the Algolia sort indexes (products_price_asc/_desc,
    // products_rating_desc) were never created, so every sort is a no-op.
    // Fixed by running backend/src/scripts/apply-algolia-settings.ts; remove
    // this marker once it has run.
    test.fail()
    await page.goto('/ph/categories')
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
    // Algolia listings sort through the dropdown, not a URL parameter. Click
    // it where a shopper would: its centre, which on desktop is the chevron.
    await page.getByRole('button', { name: 'Sort by: Default' }).locator('visible=true').first().click()
    await page.getByRole('option', { name: 'Price: low to high' }).locator('visible=true').first().click()
    await page.waitForLoadState('networkidle')
    const prices = await page.locator('a[href*="/products/"]').evaluateAll((as) =>
      as.map((a) => (a.textContent?.match(/₱[\d,.]+/g) ?? []).map((p) => Number(p.replace(/[^\d.]/g, '')))).filter((p) => p.length).map((p) => Math.min(...p))
    )
    expect(prices.length).toBeGreaterThan(1)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  test('BRW-09 reels feed plays', async ({ page, pageErrors }) => {
    await page.goto('/ph/reels')
    await page.locator('main').getByRole('button').first().click()
    const video = page.locator('video').first()
    await expect(video).toBeAttached()
    // Playwright's Chromium can't decode H.264, so check the player got a real, reachable file
    const src = await video.evaluate((v: HTMLVideoElement) => v.currentSrc || v.src || v.querySelector('source')?.src || '')
    expect(src).toMatch(/^https:\/\/.+\.(mp4|webm|mov)/)
    const res = await page.request.get(src, { headers: { range: 'bytes=0-1023' } })
    expect([200, 206]).toContain(res.status())
    expect(res.headers()['content-type']).toMatch(/^video\//)
    await expectNoErrorBoundary(page)
    expect(pageErrors).toEqual([])
  })

  test('BRW-10 trust badges open the matching help sections', async ({ page }) => {
    for (const name of ['Buyer Protection', 'Nationwide Delivery', 'Pay Your Way']) {
      await page.goto('/ph')
      const card = page.getByRole('heading', { name, exact: true }).locator('..')
      await card.getByRole('link').first().click()
      await expect(page).toHaveURL(/help-center/)
      await expectNoErrorBoundary(page)
    }
  })

  test('BRW-11 help center renders with tutorial videos and no emoji', async ({ page, pageErrors }) => {
    await page.goto('/ph/help-center')
    await expect(page.getByRole('heading', { name: /How can we help you/i })).toBeVisible()
    await page.getByRole('button', { name: /^Play video:/ }).first().click()
    await expect(page.locator('iframe[src*="youtube"]').first()).toBeAttached()
    const text = await page.locator('body').innerText()
    expect(text.match(/\p{Emoji_Presentation}/gu) ?? []).toEqual([])
    expect(pageErrors).toEqual([])
  })

  test('BRW-12 support assistant explains pricing as a subscription', async ({ page }) => {
    await page.goto('/ph')
    await page.getByRole('button', { name: 'Open chat support' }).click()
    const input = page.getByRole('textbox').last()
    await input.fill('how much does it cost to sell?')
    await input.press('Enter')
    const answer = page.getByText(/flat monthly subscription/i).last()
    await expect(answer).toBeVisible({ timeout: 90_000 })
    const text = await answer.innerText()
    expect(text).toMatch(/first month (is )?free/i)
    // It may say "instead of a commission", never that a commission is charged
    expect(text).not.toMatch(/\d+\s?% commission|commission (per|on each) sale/i)
  })

  test('BRW-13 search on a phone', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone-width case')
    await page.goto('/ph')
    const search = page.getByPlaceholder(/search/i).locator('visible=true').first()
    await expect(search).toBeVisible()
    await search.fill('shirt')
    await search.press('Enter')
    await expect(page).toHaveURL(/query=shirt/)
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
  })
})
