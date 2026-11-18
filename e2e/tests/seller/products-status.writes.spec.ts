import { API_URL, PUBLISHABLE_KEY, apiSeller, expect, sellerToken, signInSeller, test, writesAllowed } from '../fixtures'

/**
 * SEL-07 / SEL-08: a seller publishes and unpublishes from the product page,
 * and a shop that isn't approved yet has its published product held until it is.
 */
test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')

const product = (title: string, status: string) => ({
  title,
  status,
  options: [{ title: 'Size', values: ['M'] }],
  variants: [{ title: 'M', options: { Size: 'M' }, manage_inventory: true, prices: [{ currency_code: 'php', amount: 700 }] }],
})

test('SEL-07 a draft is published, then unpublished, from the product page', async ({ page, request }) => {
  test.setTimeout(180_000)
  const email = process.env.E2E_SELLER_EMAIL!
  const password = process.env.E2E_SELLER_PASSWORD!
  const headers = { authorization: `Bearer ${await sellerToken(request, email, password)}`, 'x-publishable-api-key': PUBLISHABLE_KEY }
  const created = await (await request.post(`${API_URL}/vendor/products`, { headers, data: product(`QA Status ${Date.now()}`, 'draft') })).json()
  const id = created.product.id
  const status = async () => (await (await request.get(`${API_URL}/vendor/products/${id}?fields=status`, { headers })).json()).product?.status
  await signInSeller(page, email, password)
  await page.goto(`/products/${id}`)
  await page.getByRole('heading', { name: created.product.title }).waitFor()
  // The "..." beside the status badge, in the product's own header
  const productMenu = page.getByRole('heading', { name: created.product.title }).locator('xpath=..').getByRole('button').last()
  await productMenu.click()
  await page.getByRole('menuitem', { name: 'Publish' }).click()
  await expect.poll(status, { timeout: 30_000 }).toBe('published')
  await page.getByText('Published').first().waitFor({ timeout: 30_000 })
  await productMenu.click()
  await page.getByRole('menuitem', { name: /Unpublish/ }).click()
  await expect.poll(status, { timeout: 30_000 }).toBe('draft')
  await request.delete(`${API_URL}/vendor/products/${id}`, { headers })
})

test('SEL-08 a shop that is not approved yet sees its published product held', async ({ page, request }) => {
  test.setTimeout(180_000)
  const seller = await apiSeller(request, 'held')
  const headers = { authorization: `Bearer ${await sellerToken(request, seller.email, seller.password)}`, 'x-publishable-api-key': PUBLISHABLE_KEY }
  // A newly approved seller chooses a plan first (the first month is free)
  await request.post(`${API_URL}/vendor/subscription/trial`, { headers, data: { plan_name: 'Growth' } })
  const res = await request.post(`${API_URL}/vendor/products`, { headers, data: product(`QA Held Barong ${Date.now()}`, 'proposed') })
  expect(res.status()).toBe(201)
  await signInSeller(page, seller.email, seller.password)
  await page.goto('/products')
  await expect(page.getByText('Live when approved').first()).toBeVisible({ timeout: 60_000 })
})
