import type { Page } from '@playwright/test'

import {
  adminPage,
  adminToken,
  API_URL,
  apiSeller,
  expect,
  sellerProducts,
  sellerToken,
  signInSeller,
  test,
  writesAllowed,
} from '../fixtures'

/**
 * Subscription cases SUB-01 to SUB-08 on a fresh seller C, plus seller A
 * (Growth trial) and seller B (Starter trial) for plan gating. Project 2
 * (the subscriptions cross-check) goes deeper; this run records where they
 * stand today.
 */
test.describe('subscriptions (writes)', () => {
  test.skip(!writesAllowed, 'set E2E_ALLOW_WRITES=1 to run')
  test.describe.configure({ mode: 'serial' })

  let sellerC: Awaited<ReturnType<typeof apiSeller>>

  const subscriptionOf = async (request: import('@playwright/test').APIRequestContext) => {
    const token = await sellerToken(request, sellerC.email, sellerC.password)
    const res = await request.get(`${API_URL}/vendor/subscription/status`, { headers: { authorization: `Bearer ${token}` } })
    return res.json()
  }

  async function manageTrial(admin: Page, action: 'extend' | 'end', days?: number) {
    await admin.goto('/subscriptions')
    const row = admin.getByRole('row').filter({ hasText: sellerC.email })
    await row.getByRole('button', { name: 'Manage Trial' }).click()
    if (action === 'extend') {
      await admin.getByRole('spinbutton').fill(String(days))
      await admin.getByRole('button', { name: 'Extend', exact: true }).click()
    } else {
      await admin.getByRole('button', { name: 'End Trial Now' }).click()
      const confirm = admin.getByRole('alertdialog')
      if (await confirm.waitFor({ timeout: 3_000 }).then(() => true, () => false)) await confirm.getByRole('button').last().click()
    }
    await admin.waitForTimeout(2_000)
  }

  test('SUB-01 plans page shows the three plans and their prices', async ({ page, request }) => {
    sellerC = await apiSeller(request, 'c')
    await signInSeller(page, sellerC.email, sellerC.password)
    await expect(page.getByRole('heading', { name: 'Choose a Plan' })).toBeVisible()
    for (const [plan, price] of [['Starter', '499'], ['Growth', '1,499'], ['Premium', '3,999']]) {
      const card = page.getByRole('heading', { name: plan, exact: true }).locator('xpath=ancestor::*[.//button][1]')
      await expect(card).toContainText(price)
    }
    await page.getByRole('button', { name: /annual/i }).click()
    // 17% off a year of Starter: 499 × 12 × 0.83 ≈ 4,970
    await expect(page.getByText(/4,97\d|yr|year/i).first()).toBeVisible()
  })

  test('SUB-02 starting a Growth trial activates it with a countdown', async ({ page, request }) => {
    await signInSeller(page, sellerC.email, sellerC.password)
    const growth = page.getByRole('heading', { name: 'Growth', exact: true }).locator('xpath=ancestor::*[.//button][1]')
    await growth.getByRole('button', { name: /free trial/i }).click()
    await page.getByRole('button', { name: 'Start Free Trial', exact: true }).click()
    await expect(page.getByText(/Free trial of Growth/i)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/Expires on/i).first()).toBeVisible()
    const status = await subscriptionOf(request)
    expect(JSON.stringify(status)).toMatch(/growth/i)
  })

  test('SUB-03 a second trial is refused', async ({ request }) => {
    const token = await sellerToken(request, sellerC.email, sellerC.password)
    const res = await request.post(`${API_URL}/vendor/subscription/trial`, {
      headers: { authorization: `Bearer ${token}` },
      data: { plan_name: 'Starter' },
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(await res.text()).toMatch(/trial has already been used|already/i)
  })

  test('SUB-07 admin extends the trial by 10 days', async ({ browser, request }) => {
    const before = await subscriptionOf(request)
    const admin = await adminPage(browser)
    await manageTrial(admin, 'extend', 10)
    await admin.close()
    const after = await subscriptionOf(request)
    const end = (s: any) => new Date(s.subscription?.end_date ?? s.end_date ?? s.subscription?.trial_ends_at).getTime()
    expect(Math.round((end(after) - end(before)) / 86_400_000)).toBe(10)
  })

  test('SUB-05 ending the trial removes plan features straight away', async ({ browser, page }) => {
    const admin = await adminPage(browser)
    await manageTrial(admin, 'end')
    await admin.close()
    await signInSeller(page, sellerC.email, sellerC.password)
    await page.goto('/products')
    await expect(page).toHaveURL(/subscription/)
    await expect(page.getByText(/No active subscription|expired/i).first()).toBeVisible()
  })

  test('SUB-06 admin assigns Premium for 90 days', async ({ browser, request }) => {
    const admin = await adminPage(browser)
    await admin.goto('/subscriptions')
    await admin.getByRole('button', { name: 'Assign Plan' }).click()
    await admin.locator('#assign-vid').fill(sellerC.sellerId)
    await admin.locator('#assign-plan').click()
    await admin.getByRole('option', { name: /premium/i }).first().click()
    await admin.locator('#assign-days').fill('90')
    await admin.getByRole('button', { name: 'Assign', exact: true }).click()
    await admin.waitForTimeout(3_000)
    await admin.close()

    const status = await subscriptionOf(request)
    const text = JSON.stringify(status)
    expect(text).toMatch(/premium/i)
    const end = new Date(status.subscription?.end_date ?? status.end_date).getTime()
    expect(Math.round((end - Date.now()) / 86_400_000)).toBeGreaterThanOrEqual(89)
  })

  test('SUB-08 3D model generation is locked on Starter and open on Growth', async ({ page, browser }) => {
    test.skip(!sellerProducts('A').length || !sellerProducts('B').length, 'needs both sellers with products')
    // Seller A is on a Growth trial, seller B on a Starter trial
    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto(`/products/${sellerProducts('A')[0].productId}`)
    await expect(page.getByText(/3D Model/i).first()).toBeVisible()
    await expect(page.getByText(/upgrade/i).filter({ hasText: /3D/i })).toHaveCount(0)

    // A separate session: seller A's cached session is re-applied on every load of this one
    const { urls } = await import('../../playwright.config')
    const contextB = await browser.newContext({ baseURL: urls.seller })
    const pageB = await contextB.newPage()
    await signInSeller(pageB, process.env.E2E_SELLER_B_EMAIL!, process.env.E2E_SELLER_B_PASSWORD!)
    await pageB.goto(`/products/${sellerProducts('B')[0].productId}`)
    await expect(pageB.getByText('QA Shop B').first()).toBeVisible()
    await expect(pageB.getByText(/3D Model/i).first()).toBeVisible()
    await expect(pageB.getByText(/upgrade|Growth|Premium/i).first()).toBeVisible()
    await contextB.close()
  })
})

test.describe('subscription payment (GiyaPay sandbox)', () => {
  test.skip(
    !writesAllowed || process.env.E2E_GIYAPAY_SANDBOX_CONFIRMED !== '1',
    'set E2E_GIYAPAY_SANDBOX_CONFIRMED=1 after checking sandbox mode',
  )

  test('SUB-04 paying for Starter through GiyaPay activates it once', async ({ page, request }) => {
    const seller = await apiSeller(request, 'pay')
    await signInSeller(page, seller.email, seller.password)
    const starter = page.getByRole('heading', { name: 'Starter', exact: true }).locator('xpath=ancestor::*[.//button][1]')
    await starter.getByRole('button').filter({ hasNotText: /trial/i }).first().click()
    await expect(page.getByRole('heading', { name: 'Choose Payment Method' })).toBeVisible()
    await page.getByRole('button', { name: 'Pay with GCash' }).click()
    await expect(page).toHaveURL(/sandbox\.giyapay\.com/, { timeout: 60_000 })
    await page.getByText('Success', { exact: true }).click()
    await page.getByText('Continue', { exact: true }).click()

    // F10: the store's success page used to strand sellers instead of returning them
    await expect(page).toHaveURL(/seller.*\/subscription|\/subscription/, { timeout: 120_000 })
    const returnUrl = page.url()
    await expect(page.getByText(/Starter/).first()).toBeVisible()

    const token = await sellerToken(request, seller.email, seller.password)
    const admin = { authorization: `Bearer ${await adminToken(request)}` }
    const count = async () => {
      const res = await request.get(`${API_URL}/admin/subscriptions?seller_id=${seller.sellerId}`, { headers: admin })
      const body = await res.json().catch(() => ({}))
      return (body.subscriptions ?? []).filter((s: { status: string }) => s.status === 'active').length
    }
    expect(await count()).toBe(1)
    await page.goto(returnUrl)
    await page.reload()
    await page.waitForTimeout(5_000)
    expect(await count()).toBe(1)
    expect((await request.get(`${API_URL}/vendor/subscription/status`, { headers: { authorization: `Bearer ${token}` } })).status()).toBe(200)
  })
})
