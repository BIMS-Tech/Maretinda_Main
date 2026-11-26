import { API_URL, PUBLISHABLE_KEY, apiSeller, expect, sellerToken, signInSeller, test, writesAllowed } from '../fixtures'

/**
 * SEL-10 / SEL-11: a new seller sets up delivery in one form, then enters
 * stock on the Inventory page and on the product page.
 */
test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')

test('SEL-10 a new seller sets up pickup and delivery fee in one form', async ({ page, request }) => {
  test.setTimeout(240_000)
  const seller = await apiSeller(request, 'delivery')
  const headers = { authorization: `Bearer ${await sellerToken(request, seller.email, seller.password)}`, 'x-publishable-api-key': PUBLISHABLE_KEY }
  await request.post(`${API_URL}/vendor/subscription/trial`, { headers, data: { plan_name: 'Growth' } })

  await signInSeller(page, seller.email, seller.password)
  await page.goto('/shipping?tab=setup')
  const setup = page.getByTestId('delivery-setup')
  await expect(setup).toHaveAttribute('data-ready', 'false', { timeout: 60_000 })
  await expect(setup.getByText('Set up delivery').first()).toBeVisible()

  // The application's address is already filled in
  const form = page.getByTestId('delivery-setup-form')
  await expect(form.getByLabel('Province')).toHaveValue('Pampanga')
  await expect(form.getByLabel('City or municipality')).toHaveValue('Angeles City')
  await form.locator('input[type="tel"]').fill('0917 123 4567')
  await form.getByLabel('Standard delivery fee').fill('120')
  await page.getByTestId('delivery-setup-save').click()

  await expect(setup).toHaveAttribute('data-ready', 'true', { timeout: 60_000 })
  await expect(page.getByText('Buyers can check out with your products')).toBeVisible()
  const status = await (await request.get(`${API_URL}/vendor/delivery-setup`, { headers })).json()
  expect(status).toMatchObject({ ready: true, missing: [] })
  expect(status.options.map((o: any) => [o.name, o.fee])).toEqual([['Standard Delivery', 120]])
})

test('SEL-11 stock is entered on the Inventory page and shown on the product page', async ({ page, request }) => {
  test.setTimeout(240_000)
  const seller = await apiSeller(request, 'stock')
  const headers = { authorization: `Bearer ${await sellerToken(request, seller.email, seller.password)}`, 'x-publishable-api-key': PUBLISHABLE_KEY }
  await request.post(`${API_URL}/vendor/subscription/trial`, { headers, data: { plan_name: 'Starter' } })
  await request.post(`${API_URL}/vendor/delivery-setup`, {
    headers,
    data: {
      pickup: { name: 'Main store', address_1: '1 Rizal St', address_2: 'Balibago', city: 'Angeles City', province: 'Pampanga', postal_code: '2009', phone: '09171234567' },
      fees: { standard: 120 },
    },
  })
  const title = `QA Stock Tote ${Date.now()}`
  const made = await request.post(`${API_URL}/vendor/products`, {
    headers,
    data: {
      title,
      status: 'draft',
      options: [{ title: 'Size', values: ['M'] }],
      variants: [{ title: 'M', options: { Size: 'M' }, manage_inventory: true, prices: [{ currency_code: 'php', amount: 450 }] }],
    },
  })
  expect(made.status()).toBe(201)
  const productId = (await made.json()).product.id

  await signInSeller(page, seller.email, seller.password)
  await page.goto('/inventory')
  const editor = page.getByTestId('stock-editor').first()
  const row = editor.getByTestId('stock-row').filter({ hasText: title })
  await expect(row.getByText('Not entered')).toBeVisible({ timeout: 60_000 })
  await row.getByRole('spinbutton').fill('7')
  await editor.getByTestId('stock-save').click()
  await expect(row.getByText('In stock')).toBeVisible({ timeout: 30_000 })

  await page.goto(`/products/${productId}`)
  const onProduct = page.getByTestId('stock-editor').filter({ hasText: 'Stock' })
  await expect(onProduct.getByRole('spinbutton')).toHaveValue('7', { timeout: 60_000 })
  // Starter has no stock alerts, but sees what is running low
  await expect(page.getByText('Sold, to ship')).toBeVisible()
})
