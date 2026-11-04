import { expect, test, uniqueEmail, writesAllowed } from '../fixtures'

/**
 * Buyer journey that creates data: an account, a cart and (optionally) a COD
 * order. Opt in with E2E_ALLOW_WRITES=1 and E2E_EMAIL=<a mailbox you own> —
 * signups and orders send real email through Resend. Placing the order also
 * needs E2E_PLACE_ORDER=1 because it notifies the product's seller.
 */
test.describe('buyer journey (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')
  test.describe.configure({ mode: 'serial' })

  const email = writesAllowed ? uniqueEmail('buyer') : ''
  const password = `E2e!${Date.now()}`

  test('registers a new buyer account', async ({ page }) => {
    await page.goto('/ph/register')
    await page.locator('input[name="first_name"]').fill('E2E')
    await page.locator('input[name="last_name"]').fill('Buyer')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    const confirm = page.locator('input[name="confirmPassword"], input[name="confirm_password"]')
    if (await confirm.count()) await confirm.fill(password)
    const phone = page.locator('input[name="phone"]')
    if (await phone.count()) await phone.fill('09171234567')
    await page.getByRole('button', { name: /create account|sign up|register/i }).click()

    await expect(page).not.toHaveURL(/\/register/)
  })

  test('adds a product to the cart and reaches checkout', async ({ page }) => {
    await page.goto('/ph/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).not.toHaveURL(/\/login/)

    await page.goto('/ph')
    const href = await page.locator('a[href*="/products/"]').first().getAttribute('href')
    await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)
    await page.getByRole('button', { name: 'Add to Cart' }).click()

    await page.goto('/ph/cart')
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible()
    await expect(page.getByText(/₱\s?[\d,]+/).first()).toBeVisible()
    await page.getByRole('button', { name: /checkout/i }).or(page.getByRole('link', { name: /checkout/i })).first().click()
    await expect(page).toHaveURL(/\/checkout/)
  })

  test('places a cash-on-delivery order', async ({ page }) => {
    test.skip(process.env.E2E_PLACE_ORDER !== '1', 'set E2E_PLACE_ORDER=1 to place a real order')

    await page.goto('/ph/checkout')
    await page.getByLabel(/cash on delivery/i).or(page.getByText(/cash on delivery/i)).first().click()
    await page.getByRole('button', { name: /place order/i }).click()

    await expect(page).toHaveURL(/\/order\/.+\/confirmed/, { timeout: 120_000 })
    // ed6abe82: confirmation used to show "Online Payment" for every order.
    await expect(page.getByText(/cash on delivery/i).first()).toBeVisible()
    await expect(page.getByText(/online payment/i)).toHaveCount(0)
  })
})
