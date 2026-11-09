import { expect, registerBuyer, signInBuyer, test, writesAllowed } from '../fixtures'

/**
 * Customer account cases ACC-01 to ACC-08 (ACC-05 Google sign-in is out of
 * this round by the owner's decision). Creates a buyer on test through
 * Resend's test inbox (E2E_EMAIL=delivered@resend.dev).
 */
test.describe('customer account (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')
  test.describe.configure({ mode: 'serial' })

  let buyer: { email: string; password: string }

  test('ACC-01 register', async ({ page }) => {
    buyer = await registerBuyer(page, 'acc')
    await page.goto('/ph/user')
    await expect(page.getByRole('heading', { name: 'Welcome, E2E' })).toBeVisible()
  })

  test('ACC-02 login / logout', async ({ page }) => {
    await signInBuyer(page, buyer.email, buyer.password)
    await page.goto('/ph/user')
    await page.getByRole('button', { name: 'Logout' }).first().click()
    await expect(page).not.toHaveURL(/\/user$/)
    await page.goto('/ph/user')
    await expect(page).toHaveURL(/\/login/)
  })

  test('ACC-03 wrong password', async ({ page }) => {
    await page.goto('/ph/login')
    await page.locator('input[name="email"]').fill(buyer.email)
    await page.locator('input[name="password"]').fill('Not-the-password-1')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong|failed/i).first()).toBeVisible()
  })

  test('ACC-04 forgot password sends the reset email', async ({ page }) => {
    await page.goto('/ph/forgot-password')
    await page.getByLabel('E-mail').fill(buyer.email)
    await page.getByRole('button', { name: 'Send Email' }).click()
    await expect(page.getByText(/If an account with that email address exists/)).toBeVisible()
  })

  test('ACC-06 addresses: add, edit, delete', async ({ page }) => {
    await signInBuyer(page, buyer.email, buyer.password)
    await page.goto('/ph/user/addresses')
    await page.getByRole('button', { name: 'Add Shipping Address' }).click()
    await page.locator('input[name="addressName"]').fill('Home')
    await page.locator('input[name="firstName"]').fill('E2E')
    await page.locator('input[name="lastName"]').fill('Buyer')
    await page.locator('input[name="address"]').fill('1 Rizal St')
    // The pickers filter on keystrokes, so type rather than fill
    await page.getByTestId('address-province-select').click()
    await page.getByTestId('address-province-select').pressSequentially('Pamp', { delay: 50 })
    await page.getByRole('option', { name: 'Pampanga', exact: true }).click()
    await page.getByTestId('address-city-select').click()
    await page.getByTestId('address-city-select').pressSequentially('Ange', { delay: 50 })
    await page.getByRole('option', { name: 'Angeles City', exact: true }).click()
    await page.locator('input[name="barangay"]').fill('Balibago')
    await page.locator('input[name="postalCode"]').fill('2009')
    await page.locator('input[name="phone"]').fill('9171234567')
    await page.getByRole('button', { name: /^save/i }).click()
    await expect(page.getByText(/1 Rizal St, Balibago, 2009 Angeles City, Pampanga/)).toBeVisible()
    await page.reload()
    await expect(page.getByText(/1 Rizal St, Balibago, 2009 Angeles City, Pampanga/)).toBeVisible()

    await page.getByRole('button', { name: 'Edit' }).first().click()
    await page.locator('input[name="address"]').fill('2 Mabini St')
    await page.getByRole('button', { name: /^save/i }).click()
    await expect(page.getByText(/2 Mabini St/)).toBeVisible()
    await page.reload()
    await expect(page.getByText(/2 Mabini St/)).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).first().click()
    await page.getByRole('button', { name: /^(delete|confirm|yes)/i }).last().click()
    await expect(page.getByText(/2 Mabini St/)).toHaveCount(0)
    await page.reload()
    await expect(page.getByText(/2 Mabini St/)).toHaveCount(0)
  })

  test('ACC-07 wishlist add and remove', async ({ page }) => {
    await signInBuyer(page, buyer.email, buyer.password)
    await page.goto('/ph')
    const href = await page.locator('a[href*="/products/"]').first().getAttribute('href')
    await page.goto(href!.startsWith('/ph') ? href! : `/ph${href}`)
    const title = (await page.getByRole('heading', { level: 1 }).innerText()).trim()
    await page.getByRole('button', { name: /add to wishlist/i }).first().click()
    await expect(page.getByRole('button', { name: /remove from wishlist/i }).first()).toBeVisible()

    await page.goto('/ph/user/wishlist')
    await expect(page.getByText(title).first()).toBeVisible()
    await page.getByRole('button', { name: /remove from wishlist|remove/i }).first().click()
    await expect(page.getByText(title)).toHaveCount(0)
  })

  test('ACC-08 settings: change name', async ({ page }) => {
    await signInBuyer(page, buyer.email, buyer.password)
    await page.goto('/ph/user/settings')
    await page.getByRole('button', { name: 'Edit Details' }).click()
    await page.locator('input[name="firstName"]').fill('Renamed')
    await page.getByRole('button', { name: /^save/i }).click()
    await expect(page.getByText(/Renamed/).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(/Renamed/).first()).toBeVisible()
  })
})
