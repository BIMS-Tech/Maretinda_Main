import path from 'node:path'

import { expect, signInSeller, test, writesAllowed } from '../fixtures'

/**
 * SOP-07: a seller posts a reel and it appears on their shop page and in the
 * storefront feed. Uploads land in the media bucket test shares with
 * production; nothing deletes them.
 */
test.describe('seller reels (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')

  test('SOP-07 a published reel shows on the shop and in the feed', async ({ page, browser }) => {
    const title = `QA reel ${Date.now()}`
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto('/reels/create')
    await page.locator('input[type=file]').setInputFiles(path.join(__dirname, '..', 'assets', 'qa-reel.mp4'))
    await page.getByPlaceholder('Unboxing our bestseller').fill(title)
    await page.getByPlaceholder("Tell shoppers what they're looking at").fill('Posted by the production-readiness test run.')
    await page.getByRole('button', { name: 'Publish', exact: true }).click()
    await expect(page).toHaveURL(/\/reels\/reel_/, { timeout: 180_000 })
    await expect(page.getByText(title).first()).toBeVisible()

    const { urls } = await import('../../playwright.config')
    const store = await browser.newPage({ baseURL: urls.store })
    await expect(async () => {
      await store.goto('/ph/reels')
      await expect(store.getByText(title).first()).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 120_000 })
    await expect(async () => {
      await store.goto('/ph/sellers/qa-shop-a/reels')
      await expect(store.getByText(title).first()).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 180_000 })
    await store.close()
  })
})
