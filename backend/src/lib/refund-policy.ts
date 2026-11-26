/**
 * The return, refund and cancellation rules from "Maretinda Proposal for
 * Return, Refund, and Cancellation Policies" (Section 1 and 3), as plain
 * functions: what may be claimed, what proof it needs, and who gets how much.
 *
 * The payment processing fee is 2.5% until GiyaPay's real rates are confirmed
 * (the proposal marks it tentative); PAYMENT_PROCESSING_RATE overrides it.
 */

export const SELLER_RESPONSE_HOURS = 48
export const INSPECTION_HOURS = 48
export const SHIP_BACK_DAYS = 5
export const DISPUTE_DECISION_DAYS = 7
/** Refund turnaround promised to buyers, in business days from approval. */
export const REFUND_BUSINESS_DAYS = { online: [7, 14], cod: [3, 5] } as const

export const processingRate = (env: Record<string, string | undefined> = process.env) => {
  const n = Number(env.PAYMENT_PROCESSING_RATE)
  return Number.isFinite(n) && n >= 0 && n < 0.2 ? n : 0.025
}

/** The six eligible reasons. Change of mind is deliberately not one. */
export const RETURN_REASONS = {
  "damaged-defective": { label: "Damaged or defective", video: true, sendBack: true },
  "wrong-item": { label: "Wrong item delivered", video: false, sendBack: true },
  incomplete: { label: "Incomplete order (parts or items missing)", video: true, sendBack: true },
  "not-as-described": { label: "Not as described, or counterfeit", video: false, sendBack: true },
  expired: { label: "Expired goods", video: false, sendBack: true },
  "not-received": { label: "Not received, or lost in transit", video: false, sendBack: false },
} as const

export type ReasonCode = keyof typeof RETURN_REASONS
export const isReasonCode = (v: unknown): v is ReasonCode => typeof v === "string" && v in RETURN_REASONS

export type Evidence = { id: string; kind: "photo" | "video" }

/** What proof a claim needs, or null when it has enough. */
export function evidenceRefusal(reasons: ReasonCode[], evidence: Evidence[]): string | null {
  if (reasons.every((r) => r === "not-received")) return null
  if (!evidence.some((e) => e.kind === "photo")) {
    return "Add at least one clear photo of the problem, with the shipping waybill on the parcel in view."
  }
  if (reasons.some((r) => RETURN_REASONS[r].video) && !evidence.some((e) => e.kind === "video")) {
    return "For a damaged, defective or incomplete item, add the unboxing video: from the sealed parcel and its waybill through to checking the item."
  }
  return null
}

export type PayoutMethod = "gcash" | "maya" | "bank"
export type PayoutDetails = { method: PayoutMethod; account_name: string; account_number: string; bank_name?: string | null }

/** Where the buyer wants the refund sent. Returns it cleaned, or the message to show. */
export function parsePayout(raw: any): PayoutDetails | string {
  const method = raw?.method
  const name = typeof raw?.account_name === "string" ? raw.account_name.trim().slice(0, 120) : ""
  const number = typeof raw?.account_number === "string" ? raw.account_number.replace(/[\s-]/g, "") : ""
  if (!["gcash", "maya", "bank"].includes(method)) return "Choose where to send your refund: GCash, Maya or a bank account."
  if (name.length < 2) return "Enter the account name exactly as it appears on the account."
  if (method === "bank") {
    const bank = typeof raw?.bank_name === "string" ? raw.bank_name.trim().slice(0, 80) : ""
    if (!bank) return "Enter the bank's name."
    if (!/^\d{6,20}$/.test(number)) return "Enter the bank account number, digits only."
    return { method, account_name: name, account_number: number, bank_name: bank }
  }
  const mobile = number.replace(/^\+?63/, "0")
  if (!/^09\d{9}$/.test(mobile)) return `Enter the ${method === "gcash" ? "GCash" : "Maya"} mobile number, like 0917 123 4567.`
  return { method, account_name: name, account_number: mobile }
}

/** "GCash •••• 4567": enough to recognise, not enough to misuse. */
export function payoutLabel(p: PayoutDetails): string {
  const what = p.method === "gcash" ? "GCash" : p.method === "maya" ? "Maya" : p.bank_name || "Bank"
  return `${what} •••• ${p.account_number.slice(-4)}`
}

export type Fault = "seller" | "courier" | "buyer"
export type RefundKind = "return" | "cancellation" | "failed_delivery"

export type RefundInput = {
  kind: RefundKind
  fault: Fault
  payment: "online" | "cod"
  /** Price of the items being refunded. */
  items: number
  /** The order's delivery fee; refunded with a full seller- or courier-fault return. */
  shipping: number
  /** Whether every item of the order is being refunded. */
  full: boolean
  /** What the order cost the buyer, for the processing fee and cancellations. */
  order_total: number
  /** What the buyer paid to send the item back, when Maretinda didn't book it. */
  return_shipping?: number
  /** The courier's return-to-sender charge on a failed delivery. */
  rts_fee?: number
}

export type Line = { label: string; amount: number }
export type RefundPlan = { amount: number; refunded: Line[]; deductions: Line[]; seller_charges: Line[] }

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Who gets how much (Section 1.5 and the fee table in Section 2.4):
 * - seller fault: item + original shipping (full return) + return shipping
 *   back; the seller is charged the return shipping and the processing fee.
 * - courier fault: the same for the buyer; Maretinda helps the seller claim
 *   from the courier, so nothing extra is charged to the seller here.
 * - buyer fault (a seller's exception): the item, less return shipping and
 *   the processing fee; original shipping isn't refunded.
 * - cancellation before shipment: everything, less the processing fee when
 *   the buyer asked; when the shop cancelled, the shop bears the fee.
 * - failed delivery the buyer caused: prepaid gets the total less shipping,
 *   the courier's return fee and the processing fee; COD gets nothing back.
 */
export function planRefund(i: RefundInput, rate = processingRate()): RefundPlan {
  // The gateway's fee on the part of the payment being given back; COD has none
  const feeOn = (base: number) => (i.payment === "online" ? round(base * rate) : 0)
  const fee = feeOn(i.order_total)
  const feeLine = { label: "Payment processing fee (non-refundable)", amount: fee }
  const back = round(i.return_shipping ?? 0)

  if (i.kind === "cancellation") {
    const refunded = [{ label: "Order total", amount: i.order_total }]
    // The buyer changed their mind: the gateway's fee isn't refunded. The shop cancelled: it bears the fee.
    if (i.fault === "buyer") return finish(refunded, fee ? [feeLine] : [], [])
    return finish(refunded, [], fee && i.fault === "seller" ? [{ label: "Payment processing fee on the cancelled order", amount: fee }] : [])
  }

  if (i.kind === "failed_delivery") {
    if (i.payment === "cod") return { amount: 0, refunded: [], deductions: [], seller_charges: [] }
    const refunded = [{ label: "Order total", amount: i.order_total }]
    const deductions = [
      { label: "Original delivery fee", amount: i.shipping },
      ...(i.rts_fee ? [{ label: "Courier return-to-sender fee", amount: round(i.rts_fee) }] : []),
      ...(fee ? [feeLine] : []),
    ]
    return finish(refunded, deductions, [])
  }

  if (i.fault === "buyer") {
    const refunded = [{ label: "Item price", amount: i.items }]
    const itemFee = feeOn(i.items)
    const deductions = [...(back ? [{ label: "Return shipping", amount: back }] : []), ...(itemFee ? [{ ...feeLine, amount: itemFee }] : [])]
    return finish(refunded, deductions, [])
  }

  const refunded = [
    { label: "Item price", amount: i.items },
    ...(i.full && i.shipping ? [{ label: "Original delivery fee", amount: i.shipping }] : []),
    ...(back ? [{ label: "Return shipping you paid", amount: back }] : []),
  ]
  const paidBack = feeOn(i.items + (i.full ? i.shipping : 0))
  const sellerCharges =
    i.fault === "seller"
      ? [
          ...(back ? [{ label: "Return shipping", amount: back }] : []),
          ...(paidBack ? [{ label: "Payment processing fee on the refunded amount", amount: paidBack }] : []),
        ]
      : []
  return finish(refunded, [], sellerCharges)
}

function finish(refunded: Line[], deductions: Line[], seller_charges: Line[]): RefundPlan {
  const clean = (lines: Line[]) => lines.map((l) => ({ ...l, amount: round(l.amount) })).filter((l) => l.amount > 0)
  const r = clean(refunded)
  const d = clean(deductions)
  const total = r.reduce((s, l) => s + l.amount, 0) - d.reduce((s, l) => s + l.amount, 0)
  return { amount: Math.max(0, round(total)), refunded: r, deductions: d, seller_charges: clean(seller_charges) }
}

/** Adds business days (Monday to Friday), for the refund date promised to the buyer. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from)
  let left = days
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = new Date(d.getTime() + 8 * 3600_000).getUTCDay() // Manila
    if (day !== 0 && day !== 6) left--
  }
  return d
}

/** Paid-online orders may be cancelled through support until they ship; COD and unpaid ones by the buyer. */
export function cancellationRefusal(order: { shipped: boolean; canceled: boolean; perishable?: boolean }): string | null {
  if (order.canceled) return "This order is already cancelled."
  if (order.shipped) {
    return "This order is already with the courier, so it can't be cancelled. Once it arrives you can ask for a return if something is wrong."
  }
  return null
}
