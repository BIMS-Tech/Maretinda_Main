import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createCustomer, createPublishableKey, createSeller, multipart, noThrow, pgOf } from "../helpers"
import { codBlocked, recordFailedDelivery, refundForCanceledOrder } from "../../src/lib/cancellations"
import { runReturnDeadlines } from "../../src/lib/return-cases"
import { recoverFromDeposits } from "../../src/lib/seller-charges"
import { markSettled, releaseSettled, unsettledLines } from "../../src/lib/settlement-lines"

jest.setTimeout(300 * 1000)

/**
 * The return, refund and cancellation process of the policy proposal: proof,
 * 48-hour answers, shipping back, inspection, Maretinda's decision, refunds
 * logged with proof, and what sellers owe afterwards.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })
    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    const DAY = 24 * 3600_000
    const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])
    const MP4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42"), Buffer.alloc(64)])
    const payout = { method: "gcash", account_name: "Juan Dela Cruz", account_number: "09171234567" }
    const as = (token: string) => ({ headers: { "x-publishable-api-key": pk, ...bearer(token) }, ...noThrow })

    /** A delivered order of two ₱500 items with ₱120 delivery, from one shop. */
    async function delivered({
      daysAgo = 1,
      online = false,
      ship = true,
      deliver = true,
      items = [{ title: "Barong", quantity: 2, unit_price: 500 }] as { title: string; quantity: number; unit_price: number }[],
    } = {}) {
      const c = getContainer()
      const pg = pgOf(c)
      const buyer = await createCustomer(c)
      const shop = await createSeller(c, { email: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test` })
      const order: any = await c.resolve(Modules.ORDER).createOrders({
        currency_code: "php",
        email: buyer.customer.email,
        customer_id: buyer.customer.id,
        items,
        shipping_methods: [{ name: "Standard", amount: 120 }],
      } as any)
      await c.resolve(ContainerRegistrationKeys.LINK).create({ seller: { seller_id: shop.seller.id }, [Modules.ORDER]: { order_id: order.id } })
      if (ship) {
        const id = `ful_${Math.random().toString(36).slice(2, 12)}`
        const at = new Date(Date.now() - daysAgo * DAY)
        await pg("fulfillment").insert({ id, location_id: "sloc_test", packed_at: at, shipped_at: at, delivered_at: deliver ? at : null })
        await pg("order_fulfillment").insert({ id: `ordful_${id}`, order_id: order.id, fulfillment_id: id })
      }
      const pc = `pay_col_${Math.random().toString(36).slice(2, 12)}`
      const raw = JSON.stringify({ value: "1120", precision: 20 })
      await pg("payment_collection").insert({ id: pc, currency_code: "php", amount: 1120, raw_amount: raw, ...(online ? { captured_amount: 1120, raw_captured_amount: raw } : {}) })
      await pg("order_payment_collection").insert({ id: `opc_${pc}`, order_id: order.id, payment_collection_id: pc })
      await pg("payment_session").insert({ id: `ps_${pc}`, currency_code: "php", amount: 1120, raw_amount: raw, provider_id: online ? "pp_giyapay_giyapay" : "pp_system_default", payment_collection_id: pc })
      return { buyer, shop, order, line: order.items[0], shopAs: { headers: bearer(shop.token), ...noThrow } }
    }

    async function upload(token: string, type: "image/png" | "video/mp4", path = "/store/return-evidence") {
      const { body, headers } = multipart(type === "image/png" ? "photo.png" : "unboxing.mp4", type, type === "image/png" ? PNG : MP4)
      const res = await api.post(path, body, { headers: { ...headers, "x-publishable-api-key": pk, ...bearer(token) }, ...noThrow })
      return res.data.evidence?.id as string
    }

    async function open(o: Awaited<ReturnType<typeof delivered>>, reason = "damaged-defective", extra: Record<string, unknown> = {}) {
      const photo = await upload(o.buyer.token, "image/png")
      const video = await upload(o.buyer.token, "video/mp4")
      const res = await api.post(
        "/store/return-cases",
        { order_id: o.order.id, items: [{ line_item_id: o.line.id, quantity: 2, reason }], evidence: [photo, video], payout, condition_confirmed: true, ...extra },
        as(o.buyer.token)
      )
      return res
    }

    const caseOf = (id: string) => pgOf(getContainer())("return_case").where("request_id", id).first()

    it("asks for the proof the claim needs, and where to send the money", async () => {
      const o = await delivered()
      const post = (body: any) => api.post("/store/return-cases", { order_id: o.order.id, items: [{ line_item_id: o.line.id, quantity: 1, reason: "damaged-defective" }], payout, condition_confirmed: true, ...body }, as(o.buyer.token))
      expect((await post({ evidence: [] })).data.message).toMatch(/clear photo/)
      const photo = await upload(o.buyer.token, "image/png")
      expect((await post({ evidence: [photo] })).data.message).toMatch(/unboxing video/)
      expect((await post({ evidence: [photo], payout: { method: "gcash", account_name: "Juan", account_number: "123" } })).data.message).toMatch(/GCash mobile number/)
      expect((await post({ evidence: [photo], condition_confirmed: false })).data.message).toMatch(/unused/)
      expect((await api.post("/store/return-cases", { order_id: o.order.id, items: [{ line_item_id: o.line.id, quantity: 1, reason: "change-of-mind" }], payout }, as(o.buyer.token))).data.message).toMatch(/reason/)

      const video = await upload(o.buyer.token, "video/mp4")
      const made = await post({ evidence: [photo, video] })
      expect(made.status).toBe(201)
      const c = await caseOf(made.data.request_id)
      expect(c).toMatchObject({ stage: "seller_review", payout_label: "GCash •••• 4567", payment: "cod" })
      expect(new Date(c.respond_by).getTime() - Date.now()).toBeGreaterThan(47 * 3600_000)
      expect(c.payout_enc).not.toContain("0917")

      // The seller sees the proof but not the buyer's account
      const seen = await api.get(`/vendor/return-cases/${made.data.request_id}`, o.shopAs)
      expect(seen.data.return_case).toMatchObject({ stage: "seller_review", payout_label: null })
      expect(seen.data.return_case.evidence.map((e: any) => e.kind).sort()).toEqual(["photo", "video"])
      expect(JSON.stringify(seen.data)).not.toContain("09171234567")
    })

    it("only within 7 days of delivery, and once per order", async () => {
      const late = await delivered({ daysAgo: 9 })
      expect((await open(late)).data.message).toMatch(/7-day return period/)
      const o = await delivered()
      expect((await open(o)).status).toBe(201)
      expect((await open(o)).status).toBe(409)
    })

    it("one return at a time per order, and an item is claimed once", async () => {
      const o = await delivered({
        items: [
          { title: "Barong", quantity: 2, unit_price: 500 },
          { title: "Salakot", quantity: 1, unit_price: 300 },
        ],
      })
      const barong = o.order.items.find((i: any) => i.title === "Barong")
      const hat = o.order.items.find((i: any) => i.title === "Salakot")
      const first = await open({ ...o, line: barong })
      expect(first.status).toBe(201)

      // Asking again while it is open points at the one already asked for
      const again = await open({ ...o, line: hat }, "wrong-item")
      expect(again.status).toBe(409)
      expect(again.data).toMatchObject({ code: "return_open", request_id: first.data.request_id })

      // The buyer's list says it is open and what it covers; another buyer sees none of it
      const list = await api.get(`/store/return-cases?order_id=${o.order.id}`, as(o.buyer.token))
      expect(list.data.return_cases).toEqual([
        expect.objectContaining({
          request_id: first.data.request_id,
          open: true,
          stage: "seller_review",
          stage_label: "Waiting for the seller (48 hours)",
          items: [{ line_item_id: barong.id, quantity: 2 }],
        }),
      ])
      const stranger = await createCustomer(getContainer())
      expect((await api.get(`/store/return-cases?order_id=${o.order.id}`, as(stranger.token))).data.return_cases).toEqual([])

      // Once it is over, whatever was decided, the same item can't be claimed again
      await pgOf(getContainer())("return_case").where("request_id", first.data.request_id).update({ stage: "closed" })
      const sameItem = await open({ ...o, line: barong })
      expect(sameItem.status).toBe(409)
      expect(sameItem.data).toMatchObject({ code: "already_returned", request_id: first.data.request_id })
      expect(sameItem.data.message).toMatch(/"Barong" was already part of a return/)
      // Another item of the order still can be
      const photo = await upload(o.buyer.token, "image/png")
      const other = await api.post(
        "/store/return-cases",
        { order_id: o.order.id, items: [{ line_item_id: hat.id, quantity: 1, reason: "wrong-item" }], evidence: [photo], payout, condition_confirmed: true },
        as(o.buyer.token)
      )
      expect(other.status).toBe(201)
    })

    it("two requests sent at the same moment make one return", async () => {
      const o = await delivered()
      const [a, b] = await Promise.all([open(o), open(o)])
      expect([a.status, b.status].sort()).toEqual([201, 409])
      const pg = pgOf(getContainer())
      expect(await pg("return_case").where("order_id", o.order.id)).toHaveLength(1)
      expect(await pg("order_return_request_line_item").where("line_item_id", o.line.id).whereNull("deleted_at")).toHaveLength(1)
    })

    it("a parcel that never arrived is refunded without a return or photos", async () => {
      const o = await delivered({ deliver: false })
      const res = await api.post("/store/return-cases", { order_id: o.order.id, items: [{ line_item_id: o.line.id, quantity: 2, reason: "not-received" }], evidence: [], payout }, as(o.buyer.token))
      expect(res.status).toBe(201)
      const answered = await api.post(`/vendor/return-cases/${res.data.request_id}/respond`, { action: "accept_return" }, o.shopAs)
      expect(answered.data.stage).toBe("refund_due")
      const refund = await pgOf(getContainer())("buyer_refund").where("request_id", res.data.request_id).first()
      expect(Number(refund.amount)).toBe(1120)
    })

    it("taken back: the buyer ships it, the seller confirms, and the refund covers item, delivery and the return postage", async () => {
      const o = await delivered()
      const { data } = await open(o)
      expect((await api.post(`/vendor/return-cases/${data.request_id}/respond`, { action: "accept_return", instructions: "Use J&T" }, o.shopAs)).data.stage).toBe("awaiting_return")
      const c = await caseOf(data.request_id)
      expect(new Date(c.ship_back_by).getTime() - Date.now()).toBeGreaterThan(4.9 * DAY)
      expect((await getContainer().resolve("order_return" as any).retrieveOrderReturnRequest(data.request_id)).status).toBe("refunded")

      expect((await api.post(`/store/return-cases/${data.request_id}/shipped`, { courier: "J&T", tracking_number: "x" }, as(o.buyer.token))).data.message).toMatch(/tracking number/)
      expect((await api.post(`/store/return-cases/${data.request_id}/shipped`, { courier: "J&T", tracking_number: "JT123456", fee: 95 }, as(o.buyer.token))).data.stage).toBe("in_transit")
      expect((await api.post(`/vendor/return-cases/${data.request_id}/received`, { outcome: "ok" }, o.shopAs)).data.stage).toBe("refund_due")

      const refund = await pgOf(getContainer())("buyer_refund").where("request_id", data.request_id).first()
      expect(Number(refund.amount)).toBe(1215)
      expect(refund.payout_label).toBe("GCash •••• 4567")
      const charges = await pgOf(getContainer())("seller_charge").where("refund_id", refund.id).select("label", "amount")
      expect(charges.map((ch: any) => [ch.label.split(",")[0], Number(ch.amount)])).toEqual([["Return shipping", 95]])
    })

    it("disputed with proof, escalated by the buyer, and decided by Maretinda", async () => {
      const o = await delivered()
      const { data } = await open(o)
      const respond = (body: any) => api.post(`/vendor/return-cases/${data.request_id}/respond`, body, o.shopAs)
      expect((await respond({ action: "dispute", note: "Packed it fine, see video" })).data.message).toMatch(/proof/)
      const proof = await upload(o.shop.token, "video/mp4", "/vendor/return-evidence")
      expect((await respond({ action: "dispute", note: "Packed it fine, see video", evidence: [proof] })).data.stage).toBe("declined")
      expect((await respond({ action: "accept_return" })).status).toBe(409)

      expect((await api.post(`/store/return-cases/${data.request_id}/escalate`, { note: "It arrived broken, see my video" }, as(o.buyer.token))).data.stage).toBe("escalated")
      const c = await caseOf(data.request_id)
      expect(new Date(c.decide_by).getTime() - Date.now()).toBeGreaterThan(6.9 * DAY)

      const admin = { headers: bearer((await createAdmin(getContainer())).token), ...noThrow }
      const detail = await api.get(`/admin/return-cases/${data.request_id}`, admin)
      expect(detail.data.return_case.payout).toMatchObject({ account_number: "09171234567" })
      expect((await api.post(`/admin/return-cases/${data.request_id}/decide`, { decision: "refund" }, admin)).data.message).toMatch(/note/)
      const decided = await api.post(`/admin/return-cases/${data.request_id}/decide`, { decision: "refund", fault: "courier", note: "Courier damage" }, admin)
      expect(decided.data.stage).toBe("awaiting_return")
    })

    it("Maretinda can reject a claim, and the old routes point to the new ones", async () => {
      const o = await delivered()
      const { data } = await open(o)
      const proof = await upload(o.shop.token, "image/png", "/vendor/return-evidence")
      await api.post(`/vendor/return-cases/${data.request_id}/respond`, { action: "dispute", note: "The item in the photo isn't ours", evidence: [proof] }, o.shopAs)
      await api.post(`/store/return-cases/${data.request_id}/escalate`, { note: "It is yours, check the waybill" }, as(o.buyer.token))
      const admin = { headers: bearer((await createAdmin(getContainer())).token), ...noThrow }
      // Through the admin panel's existing return screen
      const res = await api.post(`/admin/return-request/${data.request_id}`, { status: "canceled", admin_reviewer_note: "The waybill doesn't match" }, admin)
      expect(res.data.stage).toBe("closed")
      expect((await getContainer().resolve("order_return" as any).retrieveOrderReturnRequest(data.request_id)).status).toBe("canceled")

      const old = await api.post(
        "/store/return-request",
        { order_id: o.order.id, customer_note: "Torn", line_items: [{ line_item_id: o.line.id, quantity: 1 }] },
        as(o.buyer.token)
      )
      expect(old.status).toBe(410)
      expect(old.data.message).toMatch(/order page/)
      expect((await api.post(`/vendor/return-request/${data.request_id}`, { status: "withdrawn", vendor_reviewer_note: "x" }, o.shopAs)).status).toBe(410)
    })

    it("deadlines: unanswered requests are approved, unsent returns close, unconfirmed parcels are refunded", async () => {
      const c = getContainer()
      const a = await delivered()
      const ra = (await open(a)).data.request_id
      const b = await delivered()
      const rb = (await open(b)).data.request_id
      await api.post(`/vendor/return-cases/${rb}/respond`, { action: "accept_return" }, b.shopAs)

      const moved = await runReturnDeadlines(c, new Date(Date.now() + 49 * 3600_000))
      expect(moved).toEqual(expect.arrayContaining([{ request_id: ra, to: "approved" }]))
      expect((await caseOf(ra)).stage).toBe("awaiting_return")
      expect((await caseOf(ra)).approved_by).toBe("auto")

      await api.post(`/store/return-cases/${ra}/shipped`, { courier: "LBC", tracking_number: "LBC998877" }, as(a.buyer.token))
      await runReturnDeadlines(c, new Date(Date.now() + 6 * DAY))
      // Not sent back within 5 days: closed. The other is on its way, so it isn't.
      expect((await caseOf(rb)).stage).toBe("closed")
      expect((await caseOf(ra)).stage).toBe("in_transit")

      await runReturnDeadlines(c, new Date(Date.now() + 8 * DAY))
      expect((await caseOf(ra)).stage).toBe("inspecting")
      await runReturnDeadlines(c, new Date(Date.now() + 11 * DAY))
      expect((await caseOf(ra)).stage).toBe("refund_due")
    })

    it("accounting logs the refund with its proof; the buyer sees it on the order", async () => {
      const o = await delivered()
      const { data } = await open(o)
      await api.post(`/vendor/return-cases/${data.request_id}/respond`, { action: "refund_only" }, o.shopAs)
      const refund = await pgOf(getContainer())("buyer_refund").where("request_id", data.request_id).first()
      const admin = { headers: bearer((await createAdmin(getContainer())).token), ...noThrow }

      const due = await api.get("/admin/refunds?status=due", admin)
      expect(due.data.refunds.find((r: any) => r.id === refund.id)).toMatchObject({ amount: 1120, payout: { method: "gcash" } })

      const { body, headers } = multipart("receipt.png", "image/png", PNG)
      const receipt = await api.post("/admin/refund-receipts", body, { headers: { ...headers, ...admin.headers }, ...noThrow })
      expect(receipt.status).toBe(201)
      const pay = (b: any) => api.post(`/admin/refunds/${refund.id}/paid`, b, admin)
      expect((await pay({ method: "gcash", amount: 1120 })).data.message).toMatch(/reference/)
      expect((await pay({ reference: "GC-1", method: "gcash", amount: 1120, receipt_id: receipt.data.receipt_id })).status).toBe(200)
      expect((await pay({ reference: "GC-1", method: "gcash", amount: 1120 })).status).toBe(409)

      const seen = await api.get(`/store/account/orders/${o.order.id}/refunds`, as(o.buyer.token))
      expect(seen.data.refunds[0]).toMatchObject({ status: "paid", paid_amount: 1120, reference: "GC-1", payout_label: "GCash •••• 4567", has_receipt: true })
      expect(seen.data.refunds[0].payout).toBeUndefined()
      expect((await caseOf(data.request_id)).stage).toBe("refunded")
    })

    it("keeps the proof private to the buyer, the seller of that order, and admins", async () => {
      const o = await delivered()
      const { data } = await open(o)
      const c = await caseOf(data.request_id)
      const id = c.evidence[0].id
      const stranger = await createCustomer(getContainer())
      const otherShop = await createSeller(getContainer())
      expect((await api.get(`/store/return-evidence/${id}`, as(o.buyer.token))).status).toBe(200)
      expect((await api.get(`/vendor/return-evidence/${id}`, o.shopAs)).status).toBe(200)
      expect((await api.get(`/store/return-evidence/${id}`, as(stranger.token))).status).toBe(404)
      expect((await api.get(`/vendor/return-evidence/${id}`, { headers: bearer(otherShop.token), ...noThrow })).status).toBe(404)
      const range = await api.get(`/vendor/return-evidence/${id}`, { headers: { ...bearer(o.shop.token), range: "bytes=0-7" }, ...noThrow, responseType: "arraybuffer" as const })
      expect(range.status).toBe(206)
    })

    it("paid online: a buyer's cancellation loses the fee; a shop's cancellation refunds everything and charges the shop", async () => {
      const o = await delivered({ online: true, ship: false })
      const asked = await api.post("/store/cancellation-requests", { order_id: o.order.id, reason: "Ordered the wrong size", payout }, as(o.buyer.token))
      expect(asked.status).toBe(201)
      expect((await api.post("/store/cancellation-requests", { order_id: o.order.id, reason: "again", payout }, as(o.buyer.token))).status).toBe(409)
      const admin = { headers: bearer((await createAdmin(getContainer())).token), ...noThrow }
      const decided = await api.post(`/admin/cancellation-requests/${asked.data.id}`, { decision: "approve" }, admin)
      expect(decided.status).toBe(200)
      const refund = await pgOf(getContainer())("buyer_refund").where({ order_id: o.order.id }).first()
      expect([Number(refund.amount), refund.fault, refund.payout_label]).toEqual([1092, "buyer", "GCash •••• 4567"])

      const shop = await delivered({ online: true, ship: false })
      await getContainer().resolve(Modules.ORDER).cancel(shop.order.id)
      const made = await refundForCanceledOrder(getContainer(), shop.order.id)
      expect([Number(made!.amount), made!.fault]).toEqual([1120, "seller"])
      expect(await refundForCanceledOrder(getContainer(), shop.order.id)).toBeNull()
      const fee = await pgOf(getContainer())("seller_charge").where("refund_id", made!.id).first("amount")
      expect(Number(fee.amount)).toBe(28)
    })

    it("failed deliveries: prepaid refunded less delivery, courier fee and processing fee; repeat COD buyers lose COD", async () => {
      const c = getContainer()
      const prepaid = await delivered({ online: true, deliver: false })
      const r = await recordFailedDelivery(c, prepaid.order.id, { rts_fee: 60 }, "admin")
      const refund = await pgOf(c)("buyer_refund").where("id", (r as any).refund).first()
      expect(Number(refund.amount)).toBe(912)

      const one = await delivered({ deliver: false })
      await recordFailedDelivery(c, one.order.id, {}, "admin")
      expect(await codBlocked(pgOf(c), one.buyer.customer.id, null)).toBe(false)
      const two: any = await c.resolve(Modules.ORDER).createOrders({ currency_code: "php", email: one.buyer.customer.email, customer_id: one.buyer.customer.id, items: [{ title: "x", quantity: 1, unit_price: 100 }] } as any)
      await pgOf(c)("failed_delivery").insert({ order_id: two.id, customer_id: one.buyer.customer.id, email: one.buyer.customer.email.toLowerCase(), payment: "cod" })
      expect(await codBlocked(pgOf(c), one.buyer.customer.id, null)).toBe(true)
      expect(await codBlocked(pgOf(c), null, one.buyer.customer.email)).toBe(true)
    })

    it("what a shop owes comes out of its next payout file, then its deposit", async () => {
      const c = getContainer()
      const pg = pgOf(c)
      const { seller } = await createSeller(c)
      await pg("seller").where("id", seller.id).update({ bank_name: "Metrobank", account_number: "123", account_name: "Shop", branch_name: "X" })
      await pg("seller_charge").insert([
        { id: "chg_a", seller_id: seller.id, label: "Return shipping", amount: 95, created_at: new Date(Date.now() - 20 * DAY) },
        { id: "chg_b", seller_id: seller.id, label: "Refund after payout", amount: 2000, created_at: new Date(Date.now() - 20 * DAY) },
      ])
      // A payment ready to be paid out: ₱1,000 delivered 15 days ago
      const order: any = await c.resolve(Modules.ORDER).createOrders({ currency_code: "php", email: "b@example.test", items: [{ title: "x", quantity: 1, unit_price: 1000 }] } as any)
      await c.resolve(ContainerRegistrationKeys.LINK).create({ seller: { seller_id: seller.id }, [Modules.ORDER]: { order_id: order.id } })
      const [set] = await (c.resolve("marketplace") as any).createOrderSets([{ cart_id: "cart_owed", sales_channel_id: "sc", payment_collection_id: "pc" }])
      await c.resolve(ContainerRegistrationKeys.LINK).create({ marketplace: { order_set_id: set.id }, [Modules.ORDER]: { order_id: order.id } })
      await pg("fulfillment").insert({ id: "ful_owed", location_id: "sloc_test", packed_at: new Date(), shipped_at: new Date(), delivered_at: new Date(Date.now() - 15 * DAY) })
      await pg("order_fulfillment").insert({ id: "ordful_owed", order_id: order.id, fulfillment_id: "ful_owed" })
      await api.get("/admin/giyapay/transactions", { headers: bearer((await createAdmin(c)).token) }).catch(() => null)
      await pg("giyapay_transaction").insert({ id: "txn_owed", reference_number: "OWED1", amount: 1000, status: "SUCCESS", cart_id: "cart_owed", seller_id: seller.id })

      const [line] = (await unsettledLines(pg)).filter((l) => l.seller_id === seller.id)
      expect(line.net_amount).toBe(0) // ₱970 after fees, all of it owed
      expect(line.recoveries).toEqual([{ charge_id: "chg_a", amount: 95 }, { charge_id: "chg_b", amount: 875 }])
      await markSettled(pg, [line], "tama", "gen_owed")
      await releaseSettled(pg, "tama", "gen_owed")
      expect(await pg("seller_charge_recovery").where("source_id", "tama:gen_owed").first()).toBeUndefined()
      await markSettled(pg, [line], "tama", "gen_owed2")

      // What's left after 14 days comes from the deposit
      await pg("seller_deposit_entry").insert({ id: "dep_1", seller_id: seller.id, kind: "received", amount: 5000, reference: "DEP" })
      const taken = await recoverFromDeposits(pg)
      expect(taken).toEqual([{ seller_id: seller.id, amount: 1125 }])
      const admin = { headers: bearer((await createAdmin(c)).token), ...noThrow }
      const deposit = await api.get(`/admin/seller-deposits/${seller.id}`, admin)
      expect(deposit.data).toMatchObject({ balance: 3875, owed: [] })
    })
  },
})
