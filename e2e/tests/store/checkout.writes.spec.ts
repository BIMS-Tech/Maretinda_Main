import {
  addToCart,
  adminToken,
  API_URL,
  chooseDelivery,
  expect,
  fillCheckoutAddress,
  peso,
  placeCodOrder,
  PUBLISHABLE_KEY,
  registerBuyer,
  sellerProducts,
  standardShipping,
  test,
  writesAllowed,
} from '../fixtures'

/**
 * Cart and checkout cases CHK-01 to CHK-09 and CHK-14 from
 * docs/qa-test-cases.md, on seller A's ₱770 product (0.5 kg, Standard
 * Delivery ₱120) and seller B's. Orders email the buyer and seller through
 * Resend's test inbox. Placing orders needs E2E_PLACE_ORDER=1.
 */
const placeOrders = process.env.E2E_PLACE_ORDER === '1'

test.describe('cart and checkout (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test('CHK-01 add, change quantity, remove', async ({ page }) => {
    const [shirt] = sellerProducts('A')
    await registerBuyer(page, 'chk01')
    await addToCart(page, shirt.productId)
    await page.goto('/ph/cart')
    const main = page.locator('main')
    await expect(main.getByText(peso(shirt.price)).locator('visible=true').first()).toBeVisible()
    // F18: the item's real shop, not "Maretinda"
    await expect(main.getByText('QA Shop A').locator('visible=true').first()).toBeVisible()

    await main.getByRole('button', { name: 'Increase quantity' }).first().click()
    await expect(main.getByText(peso(shirt.price * 2)).locator('visible=true').first()).toBeVisible()

    await main.getByRole('button', { name: 'Decrease quantity' }).first().click()
    await expect(main.getByText(peso(shirt.price * 2))).toHaveCount(0)

    await main.getByRole('button', { name: 'Remove item' }).first().click()
    await expect(main.getByRole('heading', { name: /QA Linen Shirt/ })).toHaveCount(0)
  })

  test('CHK-02 a signed-out shopper is asked to log in to add to cart', async ({ page }) => {
    const [shirt] = sellerProducts('A')
    const res = await page.request.get(`${API_URL}/store/products/${shirt.productId}?fields=handle`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
    })
    const { product } = await res.json()
    await page.goto(`/ph/products/${product.handle}`)
    await expect(async () => {
      await page.getByRole('button', { name: 'Add to Cart' }).click()
      await expect(page).toHaveURL(/\/login\?returnTo=%2Fph%2Fproducts/, { timeout: 5_000 })
    }).toPass({ timeout: 30_000 })
  })

  test('CHK-15 an empty cart shows ₱0.00 and nothing to check out', async ({ page }) => {
    await page.goto('/ph/cart')
    const main = page.locator('main')
    await expect(main.getByText('Your shopping cart is empty')).toBeVisible()
    await expect(main.getByText('₱0.00').first()).toBeVisible()
    await expect(main.getByRole('button', { name: /select or enter a voucher/i })).toHaveCount(0)
    await expect(main.getByRole('button', { name: /checkout/i })).toHaveCount(0)
  })

  test('CHK-03 shipping options and fee', async ({ page }) => {
    const [shirt] = sellerProducts('A')
    await registerBuyer(page, 'chk03')
    await addToCart(page, shirt.productId)
    await fillCheckoutAddress(page)
    // Before a method is chosen the summary must not claim shipping is free
    await expect(page.getByText('Shipping').locator('..').getByText('Free', { exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: 'Choose Delivery Option' }).click()
    // ₱770 is over ₱499, so every option ships free
    for (const name of ['Regular Delivery', 'Standard Delivery', 'Express Delivery']) {
      await expect(page.getByRole('option', { name: new RegExp(`${name}.*Free`) })).toBeVisible()
    }
    await page.getByRole('option', { name: /Standard Delivery/ }).click()
    await expect(page.getByText(peso(shirt.price + standardShipping(shirt.price))).first()).toBeVisible()
  })

  test('CHK-03 a cart under ₱499 pays for delivery', async ({ page }) => {
    const [, tote] = sellerProducts('A')
    await registerBuyer(page, 'chk03b')
    await addToCart(page, tote.productId)
    await fillCheckoutAddress(page)
    await page.getByRole('button', { name: 'Choose Delivery Option' }).click()
    for (const [name, fee] of [['Regular Delivery', 85], ['Standard Delivery', 120], ['Express Delivery', 200]] as const) {
      await expect(page.getByRole('option', { name: new RegExp(`${name}.*${peso(fee).replace(/[.]/g, '\\.')}`) })).toBeVisible()
    }
  })

  test('CHK-04 product without weight is explained at checkout', async ({ page }) => {
    test.skip(true, 'Not applicable on test: every seller uses flat-rate delivery; only couriers (off on test) price by weight')
    // IBITA Fashion's Denim Trouser has no weight on test
    await registerBuyer(page, 'chk04')
    await addToCart(page, 'prod_01KVNT9Q4B7GQEYHYXD02W391F')
    await fillCheckoutAddress(page).catch(() => undefined)
    await expect(page.getByText(/weight/i).first()).toBeVisible()
  })

  test.describe('orders', () => {
    test.skip(!placeOrders, 'set E2E_PLACE_ORDER=1 to place real orders on test')

    test('CHK-05 COD order, CHK-06 payment authorized, CHK-14 order history', async ({ page, request }) => {
      const [shirt] = sellerProducts('A')
      await registerBuyer(page, 'chk05')
      await addToCart(page, shirt.productId)
      await fillCheckoutAddress(page)
      await chooseDelivery(page, 'Standard Delivery')
      const orderId = await placeCodOrder(page)

      await expect(page.getByText(/cash on delivery/i).first()).toBeVisible()
      await expect(page.getByText(/online payment/i)).toHaveCount(0)
      await expect(page.getByText(`Total${peso(shirt.price + standardShipping(shirt.price))}`).or(page.getByText(peso(shirt.price + standardShipping(shirt.price)))).first()).toBeVisible()

      // CHK-06: COD stays authorized until the seller collects the cash
      const token = await adminToken(request)
      const res = await request.get(`${API_URL}/admin/orders/${orderId}?fields=payment_status,total`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const { order } = await res.json()
      expect(order.payment_status).toBe('authorized')
      expect(order.total).toBe(shirt.price + standardShipping(shirt.price))

      // CHK-14: the confirmation's order link opens a page that agrees with it
      await page.locator('main').getByRole('link', { name: /track order/i }).click()
      await expect(page).toHaveURL(/\/user\/orders\/[^/]+$/)
      await expect(page.getByText('Something went wrong')).toHaveCount(0)
      await expect(page.getByText(peso(shirt.price + standardShipping(shirt.price))).first()).toBeVisible()
    })

    test('CHK-09 two sellers in one cart make one order each', async ({ page, request }) => {
      test.skip(!sellerProducts('B').length, 'set E2E_SELLER_B_PRODUCTS')
      const [shirtA] = sellerProducts('A')
      const [, toteB] = sellerProducts('B')
      await registerBuyer(page, 'chk09')
      await addToCart(page, shirtA.productId)
      await addToCart(page, toteB.productId)
      await fillCheckoutAddress(page)
      await chooseDelivery(page, 'Standard Delivery')
      await page.screenshot({ path: test.info().outputPath('payment-step.png'), fullPage: true })
      const orderId = await placeCodOrder(page)

      const token = await adminToken(request)
      const res = await request.get(`${API_URL}/admin/orders/${orderId}?fields=email,created_at`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const { order } = await res.json()
      const list = await request.get(
        `${API_URL}/admin/orders?q=${encodeURIComponent(order.email)}&fields=id,email,total,*items`,
        { headers: { authorization: `Bearer ${token}` } },
      )
      const orders = (await list.json()).orders.filter((o: { email: string }) => o.email === order.email)
      expect(orders).toHaveLength(2)
      // Each seller's order carries only its own item plus its own ₱120 shipping
      const totals = orders.map((o: { total: number }) => o.total).sort((a: number, b: number) => a - b)
      // The cart reaches ₱499, so both sellers' Standard Delivery is free
      expect(totals).toEqual([toteB.price, shirtA.price].sort((a, b) => a - b))
    })
  })

  test.describe('GiyaPay sandbox', () => {
    // Test runs GiyaPay in sandbox mode (giyapay_config.sandbox_mode). Never run against production.
    test.skip(
      !placeOrders || process.env.E2E_GIYAPAY_SANDBOX_CONFIRMED !== '1',
      'set E2E_PLACE_ORDER=1 and E2E_GIYAPAY_SANDBOX_CONFIRMED=1 after checking sandbox mode',
    )

    async function payWithGcash(page: import('@playwright/test').Page, outcome: 'Success' | 'Cancel') {
      const [shirt] = sellerProducts('A')
      await addToCart(page, shirt.productId)
      await fillCheckoutAddress(page)
      await chooseDelivery(page, 'Standard Delivery')
      await page.getByText('GCash', { exact: true }).click()
      await page.getByRole('button', { name: 'Continue to review' }).click()
      await expect(page).toHaveURL(/step=review/)
      await page.getByRole('button', { name: 'Pay with GCash' }).click()
      await expect(page).toHaveURL(/sandbox\.giyapay\.com/, { timeout: 60_000 })
      await page.getByText(outcome, { exact: true }).click()
      await page.getByText('Continue', { exact: true }).click()
    }

    test('CHK-07 GCash payment returns to a confirmed order; SEC-02 reloading the return page adds nothing', async ({ page, request }) => {
      const [shirt] = sellerProducts('A')
      const { email } = await registerBuyer(page, 'chk07')
      const started = Date.now()
      await payWithGcash(page, 'Success')
      await expect(page).toHaveURL(/\/order\/[^/]+\/confirmed/, { timeout: 120_000 })
      await expect(page.locator('main').getByText('GCash').first()).toBeVisible()
      await expect(page.locator('main').getByText(peso(shirt.price + standardShipping(shirt.price))).first()).toBeVisible()

      const token = await adminToken(request)
      const auth = { headers: { authorization: `Bearer ${token}` } }
      const tx = await (await request.get(`${API_URL}/admin/giyapay/transactions?status=SUCCESS&limit=20`, auth)).json()
      const mine = (tx.transactions ?? []).filter(
        (t: { created_at: string; amount: number }) => new Date(t.created_at).getTime() >= started - 60_000,
      )
      expect(mine.map((t: { amount: number }) => t.amount)).toContain(shirt.price + standardShipping(shirt.price))

      // SEC-02: going back to GiyaPay's return URL must not create a second order
      await page.goBack()
      await page.reload()
      await page.waitForTimeout(5_000)
      const list = await (await request.get(`${API_URL}/admin/orders?q=${encodeURIComponent(email)}&fields=id,email`, auth)).json()
      expect(list.orders.filter((o: { email: string }) => o.email === email)).toHaveLength(1)
    })

    test('CHK-08 cancelling on GiyaPay creates no order', async ({ page, request }) => {
      const { email } = await registerBuyer(page, 'chk08')
      await payWithGcash(page, 'Cancel')
      await expect(page).not.toHaveURL(/sandbox\.giyapay\.com/, { timeout: 60_000 })
      await expect(page).not.toHaveURL(/\/confirmed/)
      await page.waitForTimeout(5_000)
      const token = await adminToken(request)
      const list = await (
        await request.get(`${API_URL}/admin/orders?q=${encodeURIComponent(email)}&fields=id,email`, {
          headers: { authorization: `Bearer ${token}` },
        })
      ).json()
      expect(list.orders.filter((o: { email: string }) => o.email === email)).toHaveLength(0)
      // The cart is still there to try again
      await page.goto('/ph/cart')
      await expect(page.locator('main').getByText(/QA Linen Shirt/).locator('visible=true').first()).toBeVisible()
    })
  })
})
