import { API_URL, expect, expectNoErrorBoundary, PUBLISHABLE_KEY, test } from '../fixtures'

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
    await expect(page).toHaveURL(/\/search\?q=shirt/)
    await expect(page.locator('[data-product]').first()).toBeVisible()
  })

  test('BRW-02 search forgives a typo', async ({ page, request }) => {
    // A real product's name with two letters swapped still finds that product
    const res = await request.get(`${API_URL}/store/search?limit=24&sort=newest`, { headers: { 'x-publishable-api-key': PUBLISHABLE_KEY } })
    const { products } = await res.json()
    const word = products.flatMap((p: { title: string }) => p.title.toLowerCase().match(/[a-z]{7,}/g) ?? [])[0]
    test.skip(!word, 'no product name with a long word')
    const typo = word.slice(0, 3) + word[4] + word[3] + word.slice(5)
    await page.goto(`/ph/search?q=${typo}`)
    await expect(page.locator('[data-product]').filter({ hasText: new RegExp(word, 'i') }).first()).toBeVisible()
  })

  test('BRW-03 product page shows the exact price', async ({ page, request, pageErrors }) => {
    test.skip(!sellerProduct, 'set E2E_SELLER_PRODUCTS')
    const [productId, , price] = sellerProduct!
    const res = await request.get(`${API_URL}/store/products/${productId}?fields=handle`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
    })
    const { product } = await res.json()
    await page.goto(`/ph/products/${product.handle}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Whole pesos, as on the cards: centavos only show when there are some
    await expect(page.getByText(`₱${Number(price).toLocaleString('en-PH')}`, { exact: true }).first()).toBeVisible()
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
    const card = page.locator('[data-product]').first()
    test.skip((await card.count()) === 0, 'no product in a live flash sale')
    const salePrice = Number(await card.getAttribute('data-price'))
    const href = await card.locator('a[href*="/products/"]').first().getAttribute('href')
    await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)
    expect(salePrice).toBeGreaterThan(0)
    // The sale price on the card appears on the product page too
    await expect(async () => {
      const pagePrices = (await page.locator('main').innerText()).match(/₱[\d,.]+/g) ?? []
      expect(pagePrices.map(peso)).toContain(salePrice)
    }).toPass()
  })

  test('BRW-06 share menu leads with Copy link', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mobile uses the OS share sheet instead of the menu')
    await openFirstProduct(page)
    await page.getByRole('button', { name: /^Share / }).click()
    const items = page.getByRole('menuitem')
    await expect(items.first()).toHaveText(/copy link/i)
  })

  test('BRW-07 seller page loads its tabs', async ({ page, request, pageErrors }) => {
    await page.goto('/ph')
    await page.getByRole('heading', { name: 'Top local sellers' }).scrollIntoViewIfNeeded()
    await expect(page.locator('a[href*="/sellers/"]').first()).toBeVisible()
    // A shop that is open: a closed shop's products are hidden, so its page has none
    const res = await request.get(`${API_URL}/store/search?limit=1&sort=popular`, { headers: { 'x-publishable-api-key': PUBLISHABLE_KEY } })
    const seller = (await res.json()).products?.[0]?.seller
    test.skip(!seller, 'no product from an open shop')
    await page.goto(`/ph/sellers/${seller.handle}`)
    await expect(page.getByRole('heading', { name: seller.name }).first()).toBeVisible()
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
    await expectNoErrorBoundary(page)
    expect(pageErrors).toEqual([])
  })

  test('BRW-08 price sorting orders by cheapest variant', async ({ page }) => {
    await page.goto('/ph/search')
    await expect(page.locator('[data-product]').first()).toBeVisible()
    // Sold-out products come after the ones in stock, so the order is checked among those in stock
    const prices = () => page.locator('[data-product][data-in-stock="true"][data-price]').evaluateAll((cards) => cards.map((c) => Number((c as HTMLElement).dataset.price)))
    const stock = () => page.locator('[data-product]').evaluateAll((cards) => cards.map((c) => (c as HTMLElement).dataset.inStock))
    for (const [option, sort, ordered] of [
      ['Price: low to high', 'price_asc', (a: number, b: number) => a - b],
      ['Price: high to low', 'price_desc', (a: number, b: number) => b - a],
    ] as const) {
      await page.getByRole('button', { name: /^Sort by/ }).locator('visible=true').first().click()
      await page.getByRole('option', { name: option }).locator('visible=true').first().click()
      await expect(page).toHaveURL(new RegExp(`sort=${sort}`))
      await expect(async () => {
        const shown = await prices()
        expect(shown.length).toBeGreaterThan(1)
        expect(shown).toEqual([...shown].sort(ordered))
        const all = await stock()
        expect(all.slice(all.indexOf('false') + 1 || all.length)).not.toContain('true')
      }).toPass()
    }
  })

  test('BRW-08 filters narrow the list and stay in the address', async ({ page, isMobile }) => {
    test.skip(isMobile, 'on phones the filters open in a sheet')
    await page.goto('/ph/search')
    await expect(page.locator('[data-product]').first()).toBeVisible()
    await page.goto('/ph/search?min_price=100&max_price=1000&sort=price_asc')
    await expect(page.locator('[data-product]').first()).toBeVisible()
    const prices = await page.locator('[data-product][data-price]').evaluateAll((cards) => cards.map((c) => Number((c as HTMLElement).dataset.price)))
    expect(Math.min(...prices)).toBeGreaterThanOrEqual(100)
    expect(Math.max(...prices)).toBeLessThanOrEqual(1000)
    await page.getByTestId('active-filters').getByRole('button', { name: /^Remove/ }).click()
    await expect(page).not.toHaveURL(/min_price/)
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
    await expect(page).toHaveURL(/\/search\?q=shirt/)
    await expect(page.locator('[data-product]').first()).toBeVisible()
  })
})
