import crypto from 'crypto'
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
  // Workers can start in the same millisecond
  return `${user}+e2e-${tag}-${Date.now()}${crypto.randomInt(1000)}@${domain}`
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

/**
 * Registers a new buyer through the storefront form and leaves them signed in.
 * Their email is confirmed through the admin API (we can't open the emailed
 * link here) unless `confirmEmail: false`, since unconfirmed buyers can't order.
 */
export async function registerBuyer(page: Page, tag: string, { confirmEmail = true } = {}) {
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
  if (confirmEmail) await confirmBuyerEmail(page.request, email)
  return { email, password }
}

/** Marks a buyer's email as confirmed, as support can from the customer page. */
export async function confirmBuyerEmail(request: import('@playwright/test').APIRequestContext, email: string, customerId?: string) {
  const admin = { authorization: `Bearer ${await adminToken(request)}` }
  let id = customerId
  if (!id) {
    const found = await request.get(`${API_URL}/admin/customers?q=${encodeURIComponent(email)}&fields=id,email,has_account`, { headers: admin })
    const { customers } = await found.json()
    id = customers?.find((c: { email: string; has_account: boolean }) => c.email === email && c.has_account)?.id
  }
  if (!id) throw new Error(`no customer account for ${email}`)
  const res = await request.post(`${API_URL}/admin/customers/${id}/email-verification`, { headers: admin })
  if (!res.ok()) throw new Error(`confirming ${email} failed: ${res.status()} ${await res.text()}`)
}

export const API_URL = process.env.API_URL || 'https://test-api.maretinda.com'
export const PUBLISHABLE_KEY =
  process.env.E2E_PUBLISHABLE_KEY || 'pk_5d82a686fb7066bf78c6f23c1910f2f279d818dddf4fe349e04e266508a95b27'

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
  // One set of choices per seller
  const sellers = page.getByRole('radiogroup', { name: /^Shipping from/ })
  await expect(sellers.first()).toBeVisible()
  for (let i = 0; i < (await sellers.count()); i++) {
    const choice = sellers.nth(i).getByRole('radio', { name: new RegExp(option) }).first()
    await choice.click()
    await expect(choice).toBeChecked()
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
/**
 * The test admin's current authenticator code. Admins sign in with a password
 * and a code (two-step sign-in); E2E_ADMIN_TOTP_SECRET is the secret the test
 * admin's authenticator was set up with.
 */
export function adminTotp(step = Math.floor(Date.now() / 30_000)): string {
  const secret = process.env.E2E_ADMIN_TOTP_SECRET
  if (!secret) throw new Error('Set E2E_ADMIN_TOTP_SECRET: the test admin signs in with two-step sign-in')
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const ch of secret.toUpperCase().replace(/[\s=]/g, '')) {
    value = (value << 5) | alphabet.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const hmac = crypto.createHmac('sha1', Buffer.from(bytes)).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const n = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(n % 1_000_000).padStart(6, '0')
}

/** A fresh code for a step not used yet: a code works once per 30 seconds. */
async function unusedAdminCode(): Promise<string> {
  const file = cacheFile('admin-totp-step')
  const last = fs.existsSync(file) ? Number(fs.readFileSync(file, 'utf8')) : 0
  let step = Math.floor(Date.now() / 30_000)
  while (step <= last) {
    await new Promise((r) => setTimeout(r, 2_000))
    step = Math.floor(Date.now() / 30_000)
  }
  fs.writeFileSync(file, String(step))
  return adminTotp(step)
}

export async function adminToken(request: import('@playwright/test').APIRequestContext) {
  const file = cacheFile('admin-token')
  if (fresh(file)) return JSON.parse(fs.readFileSync(file, 'utf8')).token as string
  const res = await request.post(`${API_URL}/auth/user/emailpass`, {
    data: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
  })
  const { token } = await res.json()
  if (!token) throw new Error(`admin sign-in failed: ${res.status()}`)
  // Second step, when this environment asks for it
  const me = await request.get(`${API_URL}/admin/users/me`, { headers: { authorization: `Bearer ${token}` } })
  if (me.status() === 403) {
    const verified = await request.post(`${API_URL}/admin/mfa/verify`, {
      headers: { authorization: `Bearer ${token}` },
      data: { code: await unusedAdminCode() },
    })
    if (!verified.ok()) throw new Error(`admin two-step sign-in failed: ${verified.status()} ${await verified.text()}`)
  }
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
  const twoStep = page.locator('[data-testid="two-step"][data-stage="verify"]')
  await expect(loginForm.or(twoStep).or(page.getByRole('link', { name: 'Orders' }).first())).toBeVisible({ timeout: 60_000 })
  let signedIn = false
  if (await loginForm.isVisible()) {
    await page.locator('input[name="email"]').fill(process.env.E2E_ADMIN_EMAIL!)
    await page.locator('input[name="password"]').fill(process.env.E2E_ADMIN_PASSWORD!)
    await page.getByRole('button', { name: /sign in|continue|log in/i }).first().click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 })
    await twoStep.waitFor({ timeout: 10_000 }).catch(() => {})
    signedIn = true
  }
  // Two-step sign-in: after the password, or again on a cached session whose second step has lapsed
  if (await twoStep.isVisible()) {
    await page.getByLabel('Authenticator code').fill(await unusedAdminCode())
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).not.toHaveURL(/two-step/, { timeout: 60_000 })
    signedIn = true
  }
  if (signedIn) await context.storageState({ path: file })
  return page
}

/**
 * Signs a seller in through the seller panel and waits for it to load.
 * Seller sign-ins are rate limited per account, so a working session is
 * cached per seller and reused for a few hours.
 */
export async function signInSeller(page: Page, email: string, password: string) {
  const file = cacheFile(`seller-${email.replace(/[^a-z0-9]/gi, '_')}`)
  const ready = page.getByRole('link', { name: 'Orders' }).or(page.getByRole('heading', { name: 'Choose a Plan' })).first()
  const loginForm = page.locator('input[name="email"]')

  if (fresh(file)) {
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    await page.context().addCookies(state.cookies)
    const origin = state.origins?.[0]
    if (origin) {
      await page.addInitScript((items: { name: string; value: string }[]) => {
        for (const { name, value } of items) window.localStorage.setItem(name, value)
      }, origin.localStorage)
    }
    await page.goto('/dashboard')
    await expect(ready.or(loginForm)).toBeVisible({ timeout: 60_000 })
    if (await ready.isVisible()) return
  }

  await page.goto('/login')
  await loginForm.fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(ready).toBeVisible({ timeout: 60_000 })
  await page.context().storageState({ path: file })
}

/**
 * Places a cash-on-delivery order through the store API for a new buyer.
 * Faster than the UI when a seller or admin spec just needs an order.
 */
export async function apiCodOrder(request: import('@playwright/test').APIRequestContext, variantId: string, quantity = 1) {
  const headers = { 'x-publishable-api-key': PUBLISHABLE_KEY }
  const call = async (method: 'get' | 'post', url: string, data?: unknown, token?: string) => {
    const res = await request[method](`${API_URL}${url}`, {
      headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(data ? { data } : {}),
    })
    if (!res.ok()) throw new Error(`${method.toUpperCase()} ${url} → ${res.status()} ${(await res.text()).slice(0, 200)}`)
    return res.json()
  }
  const email = uniqueEmail('apiorder')
  const password = `E2e!${Date.now()}`
  const { token: regToken } = await call('post', '/auth/customer/emailpass/register', { email, password })
  const { customer } = await call('post', '/store/customers', { email, first_name: 'API', last_name: 'Buyer' }, regToken)
  await confirmBuyerEmail(request, email, customer.id)
  const { token } = await call('post', '/auth/customer/emailpass', { email, password })
  const { regions } = await call('get', '/store/regions')
  const { cart } = await call('post', '/store/carts', { region_id: regions[0].id }, token)
  await call('post', `/store/carts/${cart.id}/line-items`, { variant_id: variantId, quantity }, token)
  await call('post', `/store/carts/${cart.id}`, {
    email,
    shipping_address: {
      first_name: 'API', last_name: 'Buyer', address_1: '1 Rizal St', address_2: 'Balibago', city: 'Angeles City',
      province: 'Pampanga', postal_code: '2009', country_code: 'ph', phone: '+639171234567',
    },
  }, token)
  const { shipping_options } = await call('get', `/store/shipping-options?cart_id=${cart.id}`, undefined, token)
  const standard = shipping_options.find((o: { name: string }) => /standard/i.test(o.name)) ?? shipping_options[0]
  await call('post', `/store/carts/${cart.id}/shipping-methods`, { option_id: standard.id }, token)
  const { payment_collection } = await call('post', '/store/payment-collections', { cart_id: cart.id }, token)
  await call('post', `/store/payment-collections/${payment_collection.id}/payment-sessions`, { provider_id: 'pp_system_default' }, token)
  const done = await call('post', `/store/carts/${cart.id}/complete`, {}, token)
  const order = done.order ?? done.order_set?.orders?.[0]
  const { order: full } = await call('get', `/store/orders/${order.id}?fields=id,display_id,total`, undefined, token)
  return { orderId: full.id as string, displayId: full.display_id as number, total: full.total as number, email, password, token }
}

/** Seller API token, e.g. for ownership checks against another seller's data. */
export async function sellerToken(request: import('@playwright/test').APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API_URL}/auth/seller/emailpass`, { data: { email, password } })
  return (await res.json()).token as string
}

/** Registers a seller the way the panel's chat does and approves them through the admin API. */
export async function apiSeller(request: import('@playwright/test').APIRequestContext, tag: string) {
  const email = uniqueEmail(`seller-${tag}`)
  const password = `Qa-${Date.now()}`
  const reg = await request.post(`${API_URL}/auth/seller/emailpass/register`, { data: { email, password } })
  const { token } = await reg.json()
  const app = await request.post(`${API_URL}/store/seller-application`, {
    headers: { 'x-publishable-api-key': PUBLISHABLE_KEY, authorization: `Bearer ${token}` },
    data: {
      first_name: 'QA', last_name: tag, email, mobile_number: '+639171234567',
      form_of_organization: 'Sole Proprietorship', business_name: `QA Shop ${tag}`, shop_name: `QA Shop ${tag}`,
      business_tin: '123456789000', vat_registered: false,
      business_province: 'Pampanga', business_city: 'Angeles City', business_barangay: 'Balibago',
      business_street: '1 Rizal St', business_postal_code: '2009',
      main_category: 'Other', product_count: '1–10', product_source: 'I make them myself', sells_regulated: false,
      terms_accepted: true, privacy_consent: true,
    },
  })
  if (!app.ok()) throw new Error(`application ${app.status()} ${await app.text()}`)
  const admin = { authorization: `Bearer ${await adminToken(request)}` }
  const { applications } = await (await request.get(`${API_URL}/admin/seller-applications?limit=50`, { headers: admin })).json()
  const mine = applications.find((a: { email: string }) => a.email === email)
  // Approval waits for a confirmed email; the team can confirm it for them
  await request.post(`${API_URL}/admin/seller-applications/${mine.id}/email-verified`, { headers: admin })
  const approved = await request.patch(`${API_URL}/admin/seller-applications/${mine.id}`, { headers: admin, data: { status: 'approved' } })
  if (!approved.ok()) throw new Error(`approval ${approved.status()} ${await approved.text()}`)
  return { email, password, sellerId: (await approved.json()).application.seller_id as string }
}

/** Standard Delivery for a cart whose items total this much: free from ₱499 (FREE_SHIPPING_MIN_ORDER). */
export const standardShipping = (itemTotal: number) => (itemTotal >= 499 ? 0 : 120)
