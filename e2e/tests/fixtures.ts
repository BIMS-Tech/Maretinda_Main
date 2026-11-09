import { test as base, expect, type Page } from '@playwright/test'

/**
 * Collects uncaught page errors so every test can assert the page didn't
 * crash while it was being used (the product Details tab crash showed up only
 * as a client-side exception, never as a failed request).
 */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await use(errors)
  },
})

export { expect }

export const writesAllowed = process.env.E2E_ALLOW_WRITES === '1'

/** Unique mailbox for write tests: E2E_EMAIL=you@domain → you+e2e-<ts>@domain. */
export function uniqueEmail(tag: string) {
  const base = process.env.E2E_EMAIL
  if (!base) throw new Error('Set E2E_EMAIL (a real mailbox you own) to run write tests')
  const [user, domain] = base.split('@')
  return `${user}+e2e-${tag}-${Date.now()}@${domain}`
}

export async function expectNoErrorBoundary(page: Page) {
  await expect(page.getByText(/something went wrong|application error|unexpected error/i)).toHaveCount(0)
}

/** Signs a buyer in through the storefront login form. */
export async function signInBuyer(page: Page, email: string, password: string) {
  await page.goto('/ph/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/** Registers a new buyer through the storefront form and leaves them signed in. */
export async function registerBuyer(page: Page, tag: string) {
  const email = uniqueEmail(tag)
  const password = `E2e!${Date.now()}`
  await page.goto('/ph/register')
  await page.locator('input[name="firstName"]').fill('E2E')
  await page.locator('input[name="lastName"]').fill('Buyer')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('select[name="countryCode"]').selectOption('+63')
  await page.locator('input[name="phone"]').fill('9171234567')
  await page.locator('input[name="password"]').fill(password)
  await page.locator('input[name="terms"]').check()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).not.toHaveURL(/\/register/, { timeout: 60_000 })
  return { email, password }
}
