import { API_URL, apiCodOrder, expect, PUBLISHABLE_KEY, sellerProducts, sellerToken, signInSeller, test, writesAllowed } from '../fixtures'

/**
 * SOP-10: a buyer messages a seller and the seller replies. Uses the chat
 * routes both panels call; the seller panel's Messages page must list it.
 */
test.describe('buyer and seller messages (writes)', () => {
  test.skip(!writesAllowed || !sellerProducts('A').length, 'set E2E_ALLOW_WRITES=1 and E2E_SELLER_PRODUCTS')

  test('SOP-10 buyer asks, seller sees it and replies, buyer gets the reply', async ({ page, request }) => {
    // Any signed-in buyer will do; apiCodOrder gives us one with a token
    const buyer = await apiCodOrder(request, sellerProducts('A')[0].variantId)
    const store = { 'x-publishable-api-key': PUBLISHABLE_KEY, authorization: `Bearer ${buyer.token}` }
    const sellerId = process.env.E2E_SELLER_ID!
    const question = `Is this shirt cotton? ${Date.now()}`

    const created = await request.post(`${API_URL}/store/chat`, { headers: store, data: { seller_id: sellerId, subject: 'QA Linen Shirt A' } })
    expect(created.status(), await created.text()).toBeLessThan(300)
    const { conversation } = await created.json()
    expect((await request.post(`${API_URL}/store/chat/${conversation.id}/message`, { headers: store, data: { body: question } })).status()).toBe(201)

    const seller = { authorization: `Bearer ${await sellerToken(request, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)}` }
    const { conversations } = await (await request.get(`${API_URL}/vendor/chat`, { headers: seller })).json()
    expect(conversations.map((c: { id: string }) => c.id)).toContain(conversation.id)
    expect((await request.post(`${API_URL}/vendor/chat/${conversation.id}/message`, { headers: seller, data: { body: 'Yes, 100% linen.' } })).status()).toBe(201)

    const { messages } = await (await request.get(`${API_URL}/store/chat/${conversation.id}`, { headers: store })).json()
    expect(messages.map((m: { body: string }) => m.body)).toEqual(expect.arrayContaining([question, 'Yes, 100% linen.']))

    await signInSeller(page, process.env.E2E_SELLER_EMAIL!, process.env.E2E_SELLER_PASSWORD!)
    await page.goto('/messages')
    await expect(page.getByText(/API Buyer|QA Linen Shirt A/).first()).toBeVisible({ timeout: 60_000 })
  })
})
