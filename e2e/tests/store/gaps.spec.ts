import { API_URL, expect, PUBLISHABLE_KEY, test } from '../fixtures'

/** Cases the QA list didn't cover (BRW-14, BRW-15), added 2026-11-09. */
test.describe('storefront gaps (read-only)', () => {
  test('BRW-14 hero seller count is live and there are no dead slider dots', async ({ page, request, isMobile }) => {
    test.skip(isMobile, 'the seller count and dots are desktop-only')
    const { sellers_count } = await (await request.get(`${API_URL}/store/hero-content`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
    })).json()
    await page.goto('/ph')
    const hero = page.locator('section').filter({ hasText: 'All in one place' }).first()
    // The hero caches its data for 5 minutes, so check the format, not the exact number
    if (sellers_count) await expect(hero.getByText(/^[\d,]+\s*sellers$/)).toBeVisible()
    // The hero has one slide; its four decorative "slider dots" did nothing when clicked
    await expect(hero.locator('[data-testid="hero-slider-dots"], .absolute.bottom-5 > span.rounded-full')).toHaveCount(0)
  })
})
