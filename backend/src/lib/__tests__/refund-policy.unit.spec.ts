import { addBusinessDays, evidenceRefusal, parsePayout, payoutLabel, planRefund } from "../refund-policy"

const photo = { id: "doc_1", kind: "photo" as const }
const video = { id: "doc_2", kind: "video" as const }

describe("proof a claim needs", () => {
  it("photos with the waybill for every claim, plus the unboxing video for damaged or incomplete ones", () => {
    expect(evidenceRefusal(["wrong-item"], [])).toMatch(/photo/)
    expect(evidenceRefusal(["wrong-item"], [photo])).toBeNull()
    expect(evidenceRefusal(["damaged-defective"], [photo])).toMatch(/unboxing video/)
    expect(evidenceRefusal(["incomplete", "wrong-item"], [photo, video])).toBeNull()
  })

  it("nothing for a parcel that never arrived", () => {
    expect(evidenceRefusal(["not-received"], [])).toBeNull()
  })
})

describe("where the refund goes", () => {
  it("takes GCash, Maya or a bank account, and shows only the last digits", () => {
    expect(parsePayout({ method: "gcash", account_name: "Juan Dela Cruz", account_number: "+63 917 123 4567" })).toEqual({
      method: "gcash",
      account_name: "Juan Dela Cruz",
      account_number: "09171234567",
    })
    expect(parsePayout({ method: "maya", account_name: "Juan", account_number: "12345" })).toMatch(/Maya mobile number/)
    expect(parsePayout({ method: "bank", account_name: "Juan", account_number: "001234567890" })).toMatch(/bank's name/)
    expect(parsePayout({ method: "cash", account_name: "Juan", account_number: "1" })).toMatch(/GCash, Maya or a bank/)
    const bank = parsePayout({ method: "bank", account_name: "Juan", account_number: "0012-3456-7890", bank_name: "BPI" }) as any
    expect(payoutLabel(bank)).toBe("BPI •••• 7890")
  })
})

describe("who gets how much", () => {
  const order = { payment: "online" as const, order_total: 1120, shipping: 120 }

  it("seller fault, full return: item and delivery back, the seller pays return shipping and the fee", () => {
    const p = planRefund({ ...order, kind: "return", fault: "seller", items: 1000, full: true, return_shipping: 95 }, 0.025)
    expect(p.amount).toBe(1215)
    expect(p.seller_charges).toEqual([
      { label: "Return shipping", amount: 95 },
      { label: "Payment processing fee on the refunded amount", amount: 28 },
    ])
  })

  it("seller fault, one item of several: just that item", () => {
    expect(planRefund({ ...order, kind: "return", fault: "seller", items: 400, full: false }, 0.025).amount).toBe(400)
  })

  it("courier fault: the buyer is made whole, the seller isn't charged extra", () => {
    const p = planRefund({ ...order, kind: "return", fault: "courier", items: 1000, full: true }, 0.025)
    expect(p).toMatchObject({ amount: 1120, seller_charges: [] })
  })

  it("buyer fault (a seller's exception): item less return shipping and the fee", () => {
    const p = planRefund({ ...order, kind: "return", fault: "buyer", items: 1000, full: true, return_shipping: 95 }, 0.025)
    expect(p.amount).toBe(880)
    expect(p.deductions.map((d) => d.label)).toEqual(["Return shipping", "Payment processing fee (non-refundable)"])
  })

  it("a COD buyer has no gateway fee to lose", () => {
    expect(planRefund({ ...order, payment: "cod", kind: "return", fault: "buyer", items: 1000, full: true }, 0.025).amount).toBe(1000)
  })

  it("cancelling a paid order before shipment: all of it less the fee; when the shop cancels, all of it and the shop pays the fee", () => {
    expect(planRefund({ ...order, kind: "cancellation", fault: "buyer", items: 1000, full: true }, 0.025).amount).toBe(1092)
    const shop = planRefund({ ...order, kind: "cancellation", fault: "seller", items: 1000, full: true }, 0.025)
    expect(shop).toMatchObject({ amount: 1120, seller_charges: [{ label: "Payment processing fee on the cancelled order", amount: 28 }] })
  })

  it("a failed delivery the buyer caused: prepaid gets the total less shipping, the courier's fee and the processing fee; COD nothing", () => {
    expect(planRefund({ ...order, kind: "failed_delivery", fault: "buyer", items: 1000, full: true, rts_fee: 60 }, 0.025).amount).toBe(912)
    expect(planRefund({ ...order, payment: "cod", kind: "failed_delivery", fault: "buyer", items: 1000, full: true }, 0.025).amount).toBe(0)
  })
})

describe("refund dates", () => {
  it("count Manila business days", () => {
    // Thursday 26 November 2026 plus 3 business days skips the weekend: Tuesday 1 December
    const due = addBusinessDays(new Date("2026-11-26T02:00:00Z"), 3)
    expect(due.toISOString().slice(0, 10)).toBe("2026-12-01")
  })
})
