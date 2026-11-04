import { captureCodPayment, resetCodPaymentToAuthorized } from "../cod-payment"

/**
 * Records every knex call so we can assert which table/columns each step
 * writes. The real-table behaviour is covered by
 * integration-tests/http/cod-payment.spec.ts.
 */
function fakeKnex(existingCapture: unknown = undefined) {
  const calls: { table: string; where: any[]; whereNull: string[]; update?: any; insert?: any }[] = []
  const pg = (table: string) => {
    const call: (typeof calls)[number] = { table, where: [], whereNull: [] }
    calls.push(call)
    const q: any = {
      where: (w: any) => (call.where.push(w), q),
      whereNull: (c: string) => (call.whereNull.push(c), q),
      update: async (u: any) => ((call.update = u), 1),
      insert: async (i: any) => ((call.insert = i), [i]),
      first: async () => existingCapture,
    }
    return q
  }
  return { pg, calls }
}

const ids = { paymentCollectionId: "pay_col_1", paymentId: "pay_1" }

describe("resetCodPaymentToAuthorized", () => {
  it("drives the payment badge back to authorized via payment_collection", async () => {
    const { pg, calls } = fakeKnex()
    await resetCodPaymentToAuthorized(pg, ids)

    const pc = calls.find((c) => c.table === "payment_collection")!
    expect(pc.where).toEqual([{ id: "pay_col_1" }])
    expect(pc.update).toMatchObject({ status: "authorized", captured_amount: 0, completed_at: null })
    expect(JSON.parse(pc.update.raw_captured_amount)).toEqual({ value: "0", precision: 20 })
  })

  it("clears payment.captured_at and never writes the non-existent payment.status column", async () => {
    const { pg, calls } = fakeKnex()
    await resetCodPaymentToAuthorized(pg, ids)

    const payment = calls.find((c) => c.table === "payment")!
    expect(payment.where).toEqual([{ id: "pay_1" }])
    expect(payment.update.captured_at).toBeNull()
    expect(payment.update).not.toHaveProperty("status")
    expect(payment.update).not.toHaveProperty("captured_amount")
  })

  it("soft-deletes only live capture rows", async () => {
    const { pg, calls } = fakeKnex()
    await resetCodPaymentToAuthorized(pg, ids)

    const capture = calls.find((c) => c.table === "capture")!
    expect(capture.where).toEqual([{ payment_id: "pay_1" }])
    expect(capture.whereNull).toEqual(["deleted_at"])
    expect(capture.update.deleted_at).toBeInstanceOf(Date)
  })

  it("resets the seller split to pending", async () => {
    const { pg, calls } = fakeKnex()
    await resetCodPaymentToAuthorized(pg, ids)

    const split = calls.find((c) => c.table === "split_order_payment")!
    expect(split.where).toEqual([{ payment_collection_id: "pay_col_1" }])
    expect(split.update).toMatchObject({ status: "pending", captured_amount: 0 })
  })
})

describe("captureCodPayment", () => {
  it("marks the collection completed with the captured amount", async () => {
    const { pg, calls } = fakeKnex()
    await captureCodPayment(pg, { ...ids, amount: 1499 })

    const pc = calls.find((c) => c.table === "payment_collection")!
    expect(pc.update).toMatchObject({ status: "completed", captured_amount: 1499 })
    expect(pc.update.completed_at).toBeInstanceOf(Date)
    expect(JSON.parse(pc.update.raw_captured_amount)).toEqual({ value: "1499", precision: 20 })
  })

  it("keeps a raw amount that is already serialized", async () => {
    const { pg, calls } = fakeKnex()
    const raw = JSON.stringify({ value: "1499.50", precision: 20 })
    await captureCodPayment(pg, { ...ids, amount: 1499.5, rawAmount: raw })

    expect(calls.find((c) => c.table === "payment_collection")!.update.raw_captured_amount).toBe(raw)
  })

  it("serializes a raw amount object", async () => {
    const { pg, calls } = fakeKnex()
    await captureCodPayment(pg, { ...ids, amount: 10, rawAmount: { value: "10", precision: 20 } })

    expect(calls.find((c) => c.table === "split_order_payment")!.update.raw_captured_amount).toBe(
      JSON.stringify({ value: "10", precision: 20 })
    )
  })

  it("inserts a capture record when none is live", async () => {
    const { pg, calls } = fakeKnex(undefined)
    await captureCodPayment(pg, { ...ids, amount: 500 })

    const insert = calls.find((c) => c.table === "capture" && c.insert)!
    expect(insert.insert).toMatchObject({ payment_id: "pay_1", amount: 500 })
    expect(insert.insert.id).toMatch(/^capt_/)
  })

  it("does not duplicate an existing live capture record", async () => {
    const { pg, calls } = fakeKnex({ id: "capt_existing" })
    await captureCodPayment(pg, { ...ids, amount: 500 })

    expect(calls.some((c) => c.table === "capture" && c.insert)).toBe(false)
  })

  it("stamps payment.captured_at and marks the seller split captured", async () => {
    const { pg, calls } = fakeKnex()
    await captureCodPayment(pg, { ...ids, amount: 500 })

    expect(calls.find((c) => c.table === "payment")!.update.captured_at).toBeInstanceOf(Date)
    expect(calls.find((c) => c.table === "split_order_payment")!.update).toMatchObject({
      status: "captured",
      captured_amount: 500,
    })
  })
})
