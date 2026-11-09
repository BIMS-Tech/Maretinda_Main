import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

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

export const API_URL = process.env.API_URL || 'https://test-api.maretinda.com'
export const PUBLISHABLE_KEY = 'pk_5d82a686fb7066bf78c6f23c1910f2f279d818dddf4fe349e04e266508a95b27'

/** product_id:variant_id:price entries from E2E_SELLER_PRODUCTS / E2E_SELLER_B_PRODUCTS. */
export function sellerProducts(seller: 'A' | 'B' = 'A') {
  const raw = seller === 'A' ? process.env.E2E_SELLER_PRODUCTS : process.env.E2E_SELLER_B_PRODUCTS
  return (raw ?? '').split(',').filter(Boolean).map((entry) => {
    const [productId, variantId, price] = entry.split(':')
    return { productId, variantId, price: Number(price) }
  })
}

/** "₱1,540.00" for 1540, as the storefront formats pesos. */
export const peso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export async function addToCart(page: Page, productId: string) {
  const res = await page.request.get(`${API_URL}/store/products/${productId}?fields=handle`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
  })
  const { product } = await res.json()
  await page.goto(`/ph/products/${product.handle}`)
  await page.getByRole('button', { name: 'Add to Cart' }).click()
  await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeEnabled()
  // The cart count in the header confirms the server action finished
  await page.waitForTimeout(1500)
}

/** Fills the checkout address step with an Angeles City, Pampanga address and continues. */
export async function fillCheckoutAddress(page: Page) {
  await page.goto('/ph/checkout?step=address')
  await page.getByTestId('shipping-first-name-input').fill('E2E')
  await page.getByTestId('shipping-last-name-input').fill('Buyer')
  await page.getByTestId('shipping-phone-input').fill('9171234567')
  await page.getByTestId('shipping-address-input').fill('1 Rizal St')
  // The pickers filter on keystrokes, so type rather than fill
  await page.getByTestId('shipping-province-select').click()
  await page.getByTestId('shipping-province-select').pressSequentially('Pamp', { delay: 50 })
  await page.getByRole('option', { name: 'Pampanga', exact: true }).click()
  await page.getByTestId('shipping-city-select').click()
  await page.getByTestId('shipping-city-select').pressSequentially('Ange', { delay: 50 })
  await page.getByRole('option', { name: 'Angeles City', exact: true }).click()
  await page.getByTestId('shipping-barangay-input').fill('Balibago')
  // Picking a city can reset the postal code a moment later, so re-check it
  const postal = page.getByTestId('shipping-postal-code-input')
  await expect(async () => {
    if ((await postal.inputValue()) !== '2009') await postal.fill('2009')
    await page.waitForTimeout(500)
    expect(await postal.inputValue()).toBe('2009')
  }).toPass({ timeout: 15_000 })
  await page.getByTestId('submit-address-button').click()
  await expect(page).toHaveURL(/step=delivery/)
}

/** Picks a delivery option for every seller in the cart and moves to payment. */
export async function chooseDelivery(page: Page, option = 'Standard Delivery') {
  // One picker per seller; each choice adds a "Method" line below them
  const pickers = page.getByRole('button', { name: 'Choose Delivery Option' })
  const sellers = await page.getByRole('heading', { name: /^Shipping from/ }).count()
  for (let i = 0; i < sellers; i++) {
    await pickers.nth(i).click()
    await page.getByRole('option', { name: new RegExp(option) }).first().click()
    await expect(page.getByText('Method', { exact: true })).toHaveCount(i + 1)
  }
  // The button ignores clicks while the chosen method is still saving
  await expect(async () => {
    await page.getByRole('button', { name: 'Continue to payment' }).click()
    await expect(page).toHaveURL(/step=payment/, { timeout: 5_000 })
  }).toPass({ timeout: 60_000 })
}

/** Chooses Cash on Delivery, places the order and returns the confirmed order id. */
export async function placeCodOrder(page: Page) {
  await page.getByText('Cash on Delivery', { exact: true }).click()
  await page.getByRole('button', { name: 'Continue to review' }).click()
  await expect(page).toHaveURL(/step=review/)
  await page.getByRole('button', { name: /place order/i }).click()
  await expect(page).toHaveURL(/\/order\/[^/]+\/confirmed/, { timeout: 120_000 })
  return page.url().match(/\/order\/([^/]+)\/confirmed/)![1]
}

// Admin sign-ins are rate limited per account, so the token and the browser
// session are made once and reused across specs for a few hours
const cacheFile = (name: string) => path.join(os.tmpdir(), `maretinda-e2e-${name}.json`)
const fresh = (file: string) => fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 6 * 3600_000

/** Admin API token for read checks (order payment status etc.). */
export async function adminToken(request: import('@playwright/test').APIRequestContext) {
  const file = cacheFile('admin-token')
  if (fresh(file)) return JSON.parse(fs.readFileSync(file, 'utf8')).token as string
  const res = await request.post(`${API_URL}/auth/user/emailpass`, {
    data: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
  })
  const { token } = await res.json()
  if (!token) throw new Error(`admin sign-in failed: ${res.status()}`)
  fs.writeFileSync(file, JSON.stringify({ token }))
  return token as string
}

/** A page in the admin panel, signed in once and reused. */
export async function adminPage(browser: import('@playwright/test').Browser) {
  const { urls } = await import('../playwright.config')
  const file = cacheFile('admin-state')
  const context = await browser.newContext({ baseURL: urls.admin, ...(fresh(file) ? { storageState: file } : {}) })
  const page = await context.newPage()
  await page.goto('/orders')
  // The panel redirects to /login only after it has loaded
  const loginForm = page.locator('input[name="email"]')
  await expect(loginForm.or(page.getByRole('link', { name: 'Orders' }).first())).toBeVisible({ timeout: 60_000 })
  if (await loginForm.isVisible()) {
    await page.locator('input[name="email"]').fill(process.env.E2E_ADMIN_EMAIL!)
    await page.locator('input[name="password"]').fill(process.env.E2E_ADMIN_PASSWORD!)
    await page.getByRole('button', { name: /sign in|continue|log in/i }).first().click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 })
    await context.storageState({ path: file })
  }
  return page
}
