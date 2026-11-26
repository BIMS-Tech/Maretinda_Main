import { API_URL, expect, PUBLISHABLE_KEY, test } from '../fixtures'

/**
 * A seller's email and password on the storefront. The password is right, so
 * it used to leave them half signed in: a session no page accepted. Now they
 * are told it's a seller account, and nothing is signed in until they choose.
 */
test.describe('a seller account on the storefront', () => {
  test.skip(!process.env.E2E_SELLER_EMAIL || !process.env.E2E_SELLER_PASSWORD, 'set E2E_SELLER_EMAIL and E2E_SELLER_PASSWORD')

  test('is recognised, and signs nobody in by itself', async ({ page, request, pageErrors }) => {
    const email = process.env.E2E_SELLER_EMAIL!
    const password = process.env.E2E_SELLER_PASSWORD!
    const res = await request.post(`${API_URL}/auth/customer/emailpass`, { data: { email, password }, headers: { 'x-publishable-api-key': PUBLISHABLE_KEY } })
    const { token } = await res.json()
    const { actor_id } = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    test.skip(!!actor_id, 'this seller already shops with the same sign-in')

    await page.goto('/ph/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    const card = page.getByTestId('other-account')
    await expect(card).toBeVisible()
    await expect(card.getByTestId('open-seller-centre')).toHaveAttribute('href', /seller/)
    await expect(card.getByTestId('start-shopping')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
    expect((await page.context().cookies()).find((c) => c.name === '_medusa_jwt')?.value || '').toBe('')

    // Still signed out: the account page asks them to log in
    await page.goto('/ph/user')
    await expect(page.locator('input[name="password"]').or(page.getByText(/log in|sign in/i)).first()).toBeVisible()
    expect(pageErrors).toEqual([])
  })
})
