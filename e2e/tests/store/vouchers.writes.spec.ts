import type { Page } from '@playwright/test'

import {
  addToCart,
  chooseDelivery,
  expect,
  fillCheckoutAddress,
  peso,
  placeCodOrder,
  registerBuyer,
  sellerProducts,
  test,
  writesAllowed,
} from '../fixtures'

/**
 * Voucher cases CHK-10 to CHK-12 and the voucher messages added on
 * 2026-11-09. HELLOMRTD is ₱200 off a first order over ₱1,500 and must be
 * seeded on the environment (backend/src/scripts/seed-hellomrtd.ts).
 */

async function typeCode(page: Page, code: string) {
  await page.goto('/ph/cart')
  await page.getByRole('button', { name: /select or enter a voucher|voucher.* applied/i }).click()
  await page.getByRole('button', { name: 'Enter Code' }).click()
  await page.getByPlaceholder('e.g. HELLOMRTD').fill(code)
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  const toast = page.locator('[data-sonner-toast]').last()
  await toast.waitFor({ timeout: 30_000 })
  return (await toast.innerText()).replace(/\s+/g, ' ').trim()
}

test.describe('vouchers (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')
  test.describe.configure({ mode: 'serial' })

  let buyer: { email: string; password: string }

  test('signed-out shoppers sign in before they have a cart', async ({ page }) => {
    // Guests can't add to cart, so a guest can't reach HELLOMRTD in the UI.
    // The API-level guest guard is covered by backend/integration-tests/http/vouchers.spec.ts.
    const [shirt] = sellerProducts('A')
    await addToCart(page, shirt.productId).catch(() => undefined)
    await expect(page).toHaveURL(/\/login/)
  })

  // One browser session throughout: signing in elsewhere doesn't bring the cart back
  test('voucher journey: unknown code, min spend, apply, checkout, returning buyer', async ({ page }) => {
    const [shirt] = sellerProducts('A')
    buyer = await registerBuyer(page, 'voucher')
    await addToCart(page, shirt.productId)

    await test.step('an unknown code is explained', async () => {
      expect(await typeCode(page, 'NOPE123')).toMatch(/NOPE123 isn't a valid voucher code/)
    })

    await test.step('under ₱1,500 says how much more to spend', async () => {
      expect(await typeCode(page, 'hellomrtd')).toMatch(/Spend ₱730 more to use hellomrtd \(min\. spend ₱1,500\)/i)
    })

    await test.step('CHK-11 over ₱1,500 it applies with the right totals', async () => {
      await page.goto('/ph/cart')
      await page.locator('main').getByRole('button', { name: 'Increase quantity' }).first().click()
      await expect(page.locator('main').getByText(peso(shirt.price * 2)).locator('visible=true').first()).toBeVisible()
      expect(await typeCode(page, 'hellomrtd')).toMatch(/HELLOMRTD applied/)
      await page.goto('/ph/cart')
      const summary = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      expect(summary).toContain(`Subtotal ${peso(shirt.price * 2)}`)
      expect(summary).toMatch(/−₱200\.00/)
      expect(summary).toContain(`Total ${peso(shirt.price * 2 - 200)}`)
    })

    test.skip(process.env.E2E_PLACE_ORDER !== '1', 'set E2E_PLACE_ORDER=1 to place a real order')

    await test.step('the discount survives checkout', async () => {
      await fillCheckoutAddress(page)
      await chooseDelivery(page, 'Standard Delivery')
      await placeCodOrder(page)
      const body = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
      expect(body).toMatch(/Discount ₱200\.00/)
      expect(body).toContain(`Total ${peso(shirt.price * 2 - 200)}`)
    })

    await test.step('CHK-12 the same buyer is refused it next time', async () => {
      await addToCart(page, shirt.productId)
      await page.goto('/ph/cart')
      await page.locator('main').getByRole('button', { name: 'Increase quantity' }).first().click()
      await expect(page.locator('main').getByText(peso(shirt.price * 2)).locator('visible=true').first()).toBeVisible()
      expect(await typeCode(page, 'HELLOMRTD')).toMatch(/only for first-time buyers/i)
    })
  })

  test('CHK-10 collecting a voucher puts it in the wallet once', async ({ page }) => {
    await registerBuyer(page, 'collect')
    await page.goto('/ph/vouchers')
    const collect = page.getByRole('button', { name: /^collect/i }).first()
    test.skip((await collect.count()) === 0, 'no collectable voucher listed')
    // A click before the page hydrates does nothing, so retry it
    await expect(async () => {
      if (await collect.count()) await collect.click()
      await expect(page.getByText('Collected').first()).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 45_000 })

    await page.goto('/ph/user/vouchers')
    await expect(page.getByText('HELLOMRTD').first()).toBeVisible()
    // Still collected after a reload, with nothing left to collect twice
    await page.goto('/ph/vouchers')
    await expect(page.getByText('Collected').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^collect/i })).toHaveCount(0)
  })
})
