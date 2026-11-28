import type { Locator, Page } from '@playwright/test'
import { API_URL, apiCodOrder, expect, sellerProducts, sellerToken, signInSeller, test, writesAllowed } from '../fixtures'

/** Picks a province, then a city from the list the chosen carrier gives for it. */
async function chooseArea(drawer: Locator, who: 'Sender' | 'Recipient', province: string, city: string) {
  await drawer.getByLabel(`${who} province`).selectOption({ label: province })
  const cities = drawer.getByLabel(`${who} city`)
  await expect(cities.locator('option', { hasText: city })).toHaveCount(1, { timeout: 30_000 })
  await cities.selectOption({ label: city })
}

/** Opens the booking drawer from a new COD order's page. */
async function openBooking(page: Page, request: import('@playwright/test').APIRequestContext) {
  const order = { id: (await apiCodOrder(request, sellerProducts('A')[0].variantId)).orderId }
  await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
  await page.goto(`/orders/${order.id}`)
  await page.getByRole('button', { name: 'Book Courier' }).click()
  const drawer = page.locator('.fixed.inset-0').filter({ hasText: 'Create Shipment' })
  await expect(drawer).toBeVisible()
  return { order, drawer }
}

/**
 * COU-03: the booking form offers only the provinces, cities and barangays
 * Flying Tigers books to, and says when the order's address isn't one. Books
 * nothing, so it runs on any test site with Flying Tigers switched on.
 */
test.describe('courier booking form', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test("COU-03 the address lists follow Flying Tigers' coverage", async ({ page, request }) => {
    test.setTimeout(180_000)
    const { drawer } = await openBooking(page, request)
    await expect(drawer.getByRole('combobox').first()).toContainText(/Flying Tigers/i)

    // QA Shop A's buyer is in Pampanga, which Flying Tigers doesn't serve
    const recipient = drawer.getByTestId('recipient-area')
    await expect(recipient.getByRole('alert')).toContainText("doesn't deliver to Pampanga", { timeout: 30_000 })
    const provinces = await drawer.getByLabel('Recipient province').locator('option').allInnerTexts()
    expect(provinces).toContain('Metro Manila')
    expect(provinces).toContain('Cebu')
    expect(provinces).not.toContain('Pampanga')

    // Metro Manila's cities include Manila's districts; Makati has its barangays
    await drawer.getByLabel('Recipient province').selectOption({ label: 'Metro Manila' })
    const cities = drawer.getByLabel('Recipient city')
    await expect(cities.locator('option', { hasText: 'Makati City' })).toHaveCount(1, { timeout: 30_000 })
    expect(await cities.locator('option').allInnerTexts()).toEqual(expect.arrayContaining(['Binondo', 'Quezon City']))
    expect(await cities.locator('option').allInnerTexts()).not.toContain('Metro Manila')
    await cities.selectOption({ label: 'Makati City' })
    const barangays = drawer.getByLabel('Recipient barangay')
    await expect(barangays.locator('option', { hasText: 'Bel-Air' })).toHaveCount(1, { timeout: 30_000 })
    await barangays.selectOption({ label: 'Bel-Air' })
    await expect(recipient.getByRole('alert')).toHaveCount(0)
  })
})

/**
 * COU-01: a seller books Flying Tigers for an order from the order page, gets
 * a tracking number and a waybill, then cancels the booking. Books for real
 * against whatever account the admin saved, so it only runs when that is
 * Flying Tigers' sandbox.
 */
test.describe('courier booking (Flying Tigers sandbox)', () => {
  test.skip(
    !writesAllowed || process.env.E2E_FLYINGTIGERS_SANDBOX_CONFIRMED !== '1',
    'set E2E_FLYINGTIGERS_SANDBOX_CONFIRMED=1 after checking the saved Flying Tigers keys are sandbox keys',
  )

  test('COU-01 book, get the waybill, then cancel', async ({ page, request }) => {
    test.setTimeout(180_000)
    const email = process.env.E2E_SELLER_EMAIL!
    const password = process.env.E2E_SELLER_PASSWORD!
    const headers = { authorization: `Bearer ${await sellerToken(request, email, password)}` }

    // A fresh COD order for a product with stock at QA Shop A's warehouse
    test.skip(!sellerProducts('A').length, 'set E2E_SELLER_PRODUCTS')
    const order = { id: (await apiCodOrder(request, sellerProducts('A')[0].variantId)).orderId }

    await signInSeller(page, email, password)
    await page.goto(`/orders/${order.id}`)
    // The courier section's controls are the only ones of their kind on the page
    const section = page
    await section.getByRole('button', { name: 'Book Courier' }).click()

    const drawer = page.locator('.fixed.inset-0').filter({ hasText: 'Create Shipment' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('combobox').first()).toContainText(/Flying Tigers/i)
    // Flying Tigers serves a short list of provinces and QA Shop A and its
    // buyer are in Pampanga, so book a covered route: Makati to Cebu City
    const set = (placeholder: string, nth: number, value: string) => drawer.getByPlaceholder(placeholder).nth(nth).fill(value)
    const name = drawer.getByPlaceholder('Your store / business name')
    if (!(await name.inputValue())) await name.fill('QA Shop A')
    await set('+63 9XX XXX XXXX', 0, '+639171234567')
    await set('Unit / Bldg / Street', 0, '6750 Ayala Ave')
    await chooseArea(drawer, 'Sender', 'Metro Manila', 'Makati City')
    await set('1234', 0, '1226')
    await set('Unit / Bldg / Street', 1, '1 Osmeña Blvd')
    await chooseArea(drawer, 'Recipient', 'Cebu', 'Cebu City')
    await set('1234', 1, '6000')
    const weight = drawer.getByPlaceholder('1.0')
    if (!(await weight.inputValue())) await weight.fill('1')
    const booking = page.waitForResponse((r) => r.url().includes('/vendor/shipping-orders') && r.request().method() === 'POST')
    await drawer.getByRole('button', { name: 'Book Shipment' }).click()
    const booked = await (await booking).json()
    expect(booked.order_update_error ?? null).toBeNull()
    await expect(page.getByText(/Shipment booked/i)).toBeVisible({ timeout: 60_000 })

    // The booking carries Flying Tigers' tracking number
    const active = async () => {
      const res = await (await request.get(`${API_URL}/vendor/shipping-orders?medusa_order_id=${order.id}`, { headers })).json()
      return (res.orders ?? []).find((s: any) => s.status !== 'cancelled')
    }
    await expect.poll(async () => (await active())?.tracking_number, { timeout: 30_000 }).toBeTruthy()
    const shipment = await active()
    const trackingNo: string = shipment.tracking_number
    expect(shipment).toMatchObject({ provider: 'flyingtigers', medusa_order_id: order.id })

    // Booking packs the order; it reads shipped only once the courier picks it up
    const fulfillment = async () =>
      (await (await request.get(`${API_URL}/vendor/orders/${order.id}?fields=fulfillment_status`, { headers })).json()).order
        ?.fulfillment_status
    await expect.poll(fulfillment, { timeout: 30_000 }).toBe('fulfilled')
    // An order can list earlier, cancelled bookings too; work in this one's row
    const row = page
      .locator('div')
      .filter({ hasText: trackingNo })
      .filter({ has: page.getByRole('button', { name: 'Waybill' }) })
      .last()
    await expect(row).toBeVisible({ timeout: 30_000 })

    // The waybill downloads as a PDF
    const download = page.waitForEvent('download', { timeout: 60_000 })
    await row.getByRole('button', { name: 'Waybill' }).click()
    const pdf = await (await download).path()
    const { readFileSync } = await import('fs')
    expect(readFileSync(pdf!).subarray(0, 4).toString()).toBe('%PDF')

    // Cancelling frees the order for another booking
    page.once('dialog', (d) => d.accept())
    await row.getByTitle('Cancel shipment').click()
    await expect(page.getByText(/cancel/i).filter({ hasText: /shipment|cancelled/i }).first()).toBeVisible({ timeout: 60_000 })
    await expect
      .poll(async () => {
        const res = await (await request.get(`${API_URL}/vendor/shipping-orders?medusa_order_id=${order.id}`, { headers })).json()
        return (res.orders ?? []).find((s: any) => s.tracking_number === trackingNo)?.status
      }, { timeout: 30_000 })
      .toBe('cancelled')
    await expect(section.getByRole('button', { name: 'Book Courier' })).toBeVisible()
    // Cancelled before pickup: the order is waiting to ship again
    // Medusa reports an order whose only parcel was cancelled as "canceled", not "not_fulfilled"
    await expect.poll(fulfillment, { timeout: 30_000 }).toMatch(/^(not_fulfilled|canceled)$/)
  })
})
