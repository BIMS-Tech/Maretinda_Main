import { expect, test, writesAllowed } from '../fixtures'

/**
 * SEL-09: right after signing in (no page reload) a seller can upload a shop
 * logo. The panel used to send the sign-in token it read before sign-in, so the
 * first upload was refused (401) while the form still said "updated".
 */
test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run (uploads a small image)')

// A 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNw8GkAAAITAQ1+1GxmAAAAAElFTkSuQmCC', 'base64')

test('SEL-09 uploads a shop logo right after signing in', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/login')
  await page.locator('input[name="email"]').fill(process.env.E2E_SELLER_EMAIL!)
  await page.locator('input[name="password"]').fill(process.env.E2E_SELLER_PASSWORD!)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/dashboard/, { timeout: 60_000 })
  // Client-side navigation, as a seller clicking through: no page reload
  await page.evaluate(() => {
    window.history.pushState({}, '', '/settings/store/edit')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
  const upload = page.waitForResponse((r) => r.url().includes('/uploads-vendor'))
  await page.getByRole('button', { name: /^Save/ }).last().click()
  expect((await upload).status()).toBe(200)
  await expect(page.getByText(/updated successfully/i).first()).toBeVisible({ timeout: 30_000 })
})
