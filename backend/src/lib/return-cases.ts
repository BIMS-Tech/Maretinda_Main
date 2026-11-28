import crypto from "crypto"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOrderReturnRequestWorkflow, updateOrderReturnRequestWorkflow } from "@mercurjs/requests/workflows"
import { decryptSecret, encryptSecret } from "./admin-access"
import { primaryLocationId } from "./delivery-setup"
import {
  addBusinessDays,
  DISPUTE_DECISION_DAYS,
  Evidence,
  evidenceRefusal,
  Fault,
  INSPECTION_HOURS,
  isReasonCode,
  parsePayout,
  PayoutDetails,
  payoutLabel,
  planRefund,
  RefundKind,
  ReasonCode,
  RETURN_REASONS,
  SELLER_RESPONSE_HOURS,
  SHIP_BACK_DAYS,
} from "./refund-policy"
import { caseEmails, refundEmails } from "./return-case-emails"
import { orderDeliveredAt, RETURN_WINDOW_DAYS } from "./return-window"

/**
 * The return and refund process (policy proposal, November 2026). A case sits
 * beside each return request (Mercur's order_return_request) and walks it
 * through: the seller answers within 48 hours (or it is approved for them),
 * the buyer ships it back within 5 days, the seller inspects within 48 hours,
 * then Maretinda's accounting pays the refund by hand and logs the proof.
 *
 * Mercur's request status stays the summary the rest of the system reads:
 * pending (seller to answer), withdrawn (seller disputed), escalated (with
 * Maretinda), refunded (approved: taken off the seller's payout), canceled.
 */

export type Stage =
  | "seller_review"
  | "declined"
  | "escalated"
  | "awaiting_return"
  | "in_transit"
  | "inspecting"
  | "refund_due"
  | "refunded"
  | "closed"

const HOUR = 3600_000
const DAY = 24 * HOUR
/** A seller who never confirms a parcel came back: treated as received this long after the buyer's tracking. */
export const ASSUME_RECEIVED_DAYS = 7

const pgOf = (container: any) => container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
const newId = (prefix: string) => `${prefix}_${crypto.randomBytes(10).toString("hex")}`
const text = (v: unknown, max = 1000) => (typeof v === "string" ? v.trim().slice(0, max) : "")

export const sealPayout = (p: PayoutDetails) => ({ payout_enc: encryptSecret(JSON.stringify(p)), payout_label: payoutLabel(p) })
export const openPayout = (enc: string | null): PayoutDetails | null => {
  if (!enc) return null
  try {
    return JSON.parse(decryptSecret(enc))
  } catch {
    return null
  }
}

async function setRequest(container: any, id: string, update: Record<string, unknown>) {
  await (container.resolve("order_return") as any).updateOrderReturnRequests([{ id, ...update }])
}

async function setCase(pg: any, requestId: string, update: Record<string, unknown>) {
  await pg("return_case").where("request_id", requestId).update({ ...update, updated_at: new Date() })
}

export async function getCase(pg: any, requestId: string) {
  return pg("return_case").where("request_id", requestId).first()
}

/** "online" when the buyer paid through GiyaPay; COD otherwise. */
export async function paymentOf(pg: any, orderId: string): Promise<"online" | "cod"> {
  const row = await pg("order_payment_collection as opc")
    .join("payment_session as ps", "ps.payment_collection_id", "opc.payment_collection_id")
    .where("opc.order_id", orderId)
    .whereNull("opc.deleted_at")
    .orderBy("ps.created_at", "desc")
    .first("ps.provider_id")
  return row && /giyapay/i.test(row.provider_id) ? "online" : "cod"
}

/** Totals the refund needs: the order's total and delivery fee, and its items. */
async function orderFacts(pg: any, orderId: string) {
  const summary = await pg("order_summary").where("order_id", orderId).whereNull("deleted_at").orderBy("version", "desc").first("totals")
  const totals = typeof summary?.totals === "string" ? JSON.parse(summary.totals) : summary?.totals
  const shipping = await pg("order_shipping as os")
    .join("order_shipping_method as sm", "sm.id", "os.shipping_method_id")
    .where("os.order_id", orderId)
    .whereNull("os.deleted_at")
    .sum("sm.amount as total")
    .first()
  const items = await pg("order_item as oi")
    .join("order_line_item as li", "li.id", "oi.item_id")
    .where("oi.order_id", orderId)
    .whereNull("oi.deleted_at")
    .orderBy("oi.version", "desc")
    .select("li.id", "li.unit_price", "oi.quantity")
  const quantity = new Map<string, { unit_price: number; quantity: number }>()
  for (const i of items) if (!quantity.has(i.id)) quantity.set(i.id, { unit_price: Number(i.unit_price), quantity: Number(i.quantity) })
  return {
    total: Number(totals?.current_order_total ?? totals?.original_order_total ?? 0),
    shipping: Number(shipping?.total ?? 0),
    items: quantity,
  }
}

async function shippedAt(pg: any, orderId: string): Promise<Date | null> {
  const row = await pg("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .where("of.order_id", orderId)
    .whereNull("of.deleted_at")
    .whereNull("f.canceled_at")
    .min("f.shipped_at as at")
    .first()
  return row?.at ? new Date(row.at) : null
}

export type OpenInput = {
  order_id: string
  items: { line_item_id: string; quantity: number; reason: ReasonCode }[]
  note: string
  evidence: string[]
  payout: PayoutDetails
  condition_confirmed: boolean
}

/** Checks a buyer's return request form. Returns it cleaned, or the message to show. */
export function parseOpenInput(body: any): OpenInput | string {
  const items = Array.isArray(body?.items) ? body.items : []
  if (!items.length) return "Choose at least one item and say what's wrong with it."
  const clean: OpenInput["items"] = []
  for (const i of items) {
    if (!isReasonCode(i?.reason)) return "Choose a reason for each item."
    const qty = Number(i?.quantity)
    if (typeof i?.line_item_id !== "string" || !Number.isInteger(qty) || qty < 1) return "Choose how many of each item."
    clean.push({ line_item_id: i.line_item_id, quantity: qty, reason: i.reason })
  }
  const payout = parsePayout(body?.payout)
  if (typeof payout === "string") return payout
  const sendBack = clean.some((i) => RETURN_REASONS[i.reason].sendBack)
  if (sendBack && body?.condition_confirmed !== true) {
    return "Confirm the item is unused and you still have its packaging, tags, manuals and freebies."
  }
  const evidence = Array.isArray(body?.evidence) ? body.evidence.filter((e: unknown) => typeof e === "string").slice(0, 10) : []
  return { order_id: String(body?.order_id ?? ""), items: clean, note: text(body?.note, 1000), evidence, payout, condition_confirmed: !!body?.condition_confirmed }
}

/** Stages a return can't move on from: refunded, or closed (rejected, expired or withdrawn). */
export const FINAL_STAGES: Stage[] = ["refunded", "closed"]

export type ReturnRefusal = { error: string; status: number; code?: string; request_id?: string }

/**
 * Why an order can't have a new return for these items, or null when it can.
 * One return at a time per order, and an item is claimed once: after a return
 * ends, whatever was decided, the same item can't be claimed again (other
 * items of the order still can, within the window).
 */
export async function returnBlock(db: any, orderId: string, lineItemIds: string[]): Promise<ReturnRefusal | null> {
  const cases = await db("return_case").where("order_id", orderId).select("request_id", "stage")
  const open = cases.find((c: any) => !FINAL_STAGES.includes(c.stage))
  if (open) {
    return {
      status: 409,
      code: "return_open",
      request_id: open.request_id,
      error: "You already asked for a return on this order, and it is still open. You can follow it under Returns.",
    }
  }
  if (!cases.length || !lineItemIds.length) return null
  const taken = await db("order_return_request_line_item as rli")
    .join("order_line_item as li", "li.id", "rli.line_item_id")
    .whereIn("rli.return_request_id", cases.map((c: any) => c.request_id))
    .whereIn("rli.line_item_id", lineItemIds)
    .whereNull("rli.deleted_at")
    .first("rli.return_request_id", "li.title")
  if (!taken) return null
  return {
    status: 409,
    code: "already_returned",
    request_id: taken.return_request_id,
    error: `"${taken.title}" was already part of a return on this order, so it can't be claimed again. You can see what was decided under Returns.`,
  }
}

/** A buyer asks for a return or refund. Returns the case, or what's wrong with the request. */
export async function openReturnCase(
  container: any,
  customerId: string,
  input: OpenInput,
  now = new Date()
): Promise<{ request_id: string } | ReturnRefusal> {
  const pg = pgOf(container)
  const order = await pg("order").where({ id: input.order_id, customer_id: customerId }).whereNull("deleted_at").first("id", "status", "canceled_at", "display_id")
  if (!order) return { error: "Order not found", status: 404 }
  if (order.status === "canceled" || order.canceled_at) return { error: "This order was cancelled, so there is nothing to return.", status: 400 }

  const lineItemIds = input.items.map((i) => i.line_item_id)
  const blocked = await returnBlock(pg, order.id, lineItemIds)
  if (blocked) return blocked

  // The window: 7 days from delivery. A parcel that never arrived can be claimed once it has shipped.
  const reasons = [...new Set(input.items.map((i) => i.reason))]
  const delivered = await orderDeliveredAt(pg, order.id)
  const onlyMissing = reasons.every((r) => r === "not-received")
  if (!delivered && !(onlyMissing && (await shippedAt(pg, order.id)))) {
    return { error: "You can ask for a return once the order has been delivered.", status: 400 }
  }
  if (delivered && now.getTime() > delivered.getTime() + RETURN_WINDOW_DAYS * DAY) {
    const closed = new Date(delivered.getTime() + RETURN_WINDOW_DAYS * DAY).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })
    return { error: `The ${RETURN_WINDOW_DAYS}-day return period for this order ended on ${closed}.`, status: 400 }
  }

  const facts = await orderFacts(pg, order.id)
  for (const item of input.items) {
    const ordered = facts.items.get(item.line_item_id)
    if (!ordered) return { error: "One of the items is not part of this order.", status: 400 }
    if (item.quantity > ordered.quantity) return { error: `You can return between 1 and ${ordered.quantity} of that item.`, status: 400 }
  }

  const uploads = input.evidence.length
    ? await pg("return_evidence").whereIn("id", input.evidence).where({ owner_type: "customer", owner_id: customerId }).whereNull("request_id").select("id", "kind")
    : []
  if (uploads.length !== input.evidence.length) return { error: "One of the photos or videos couldn't be found. Upload it again.", status: 400 }
  const proofRefused = evidenceRefusal(reasons, uploads as Evidence[])
  if (proofRefused) return { error: proofRefused, status: 400 }

  const reasonId = await policyReasonIds(pg, reasons)

  const link = await pg("seller_seller_order_order").where("order_id", order.id).whereNull("deleted_at").first("seller_id")
  if (!link) return { error: "We couldn't find the shop for this order. Write to support@maretinda.com.", status: 400 }

  const summary = input.items.map((i) => RETURN_REASONS[i.reason].label).filter((v, i, a) => a.indexOf(v) === i).join("; ")

  // One at a time per order: a second submit (two tabs, a double tap) waits
  // here for the first to finish, then finds it and is refused
  const created = await pg.transaction(async (trx: any): Promise<{ request_id: string } | ReturnRefusal> => {
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`return-case:${order.id}`])
    const raced = await returnBlock(trx, order.id, lineItemIds)
    if (raced) return raced

    const { result } = await createOrderReturnRequestWorkflow.run({
      container,
      input: {
        data: {
          order_id: order.id,
          customer_id: customerId,
          customer_note: [summary, input.note].filter(Boolean).join(" — ").slice(0, 1000),
          line_items: input.items.map((i) => ({ line_item_id: i.line_item_id, quantity: i.quantity, reason_id: reasonId.get(i.reason) })),
        },
        seller_id: link.seller_id,
      } as any,
    })
    const requestId = (result as any).id
    try {
      await trx("return_case").insert({
        request_id: requestId,
        order_id: order.id,
        seller_id: link.seller_id,
        customer_id: customerId,
        payment: await paymentOf(pg, order.id),
        reasons: JSON.stringify(reasons),
        evidence: JSON.stringify(uploads),
        ...sealPayout(input.payout),
        buyer_note: input.note || null,
        stage: "seller_review",
        respond_by: new Date(now.getTime() + SELLER_RESPONSE_HOURS * HOUR),
      })
      if (uploads.length) await trx("return_evidence").whereIn("id", input.evidence).update({ request_id: requestId })
    } catch (e) {
      // Don't leave the marketplace's request behind without its case
      await pg("order_return_request").where("id", requestId).update({ deleted_at: new Date() }).catch(() => {})
      throw e
    }
    return { request_id: requestId }
  })
  if ("error" in created) return created
  await caseEmails(container, created.request_id, "opened")
  return created
}

/**
 * Mercur needs a return_reason row for each line. The policy's reasons are
 * seeded by migration; one an admin deleted is put back rather than leaving
 * buyers unable to claim.
 */
async function policyReasonIds(pg: any, reasons: ReasonCode[]): Promise<Map<string, string>> {
  const rows = await pg("return_reason").whereIn("value", reasons).whereNull("deleted_at").select("id", "value")
  const ids = new Map<string, string>(rows.map((r: any) => [r.value, r.id]))
  for (const value of reasons.filter((r) => !ids.has(r))) {
    const id = `rr_${crypto.randomBytes(12).toString("hex")}`
    await pg("return_reason").insert({ id, value, label: RETURN_REASONS[value].label, created_at: new Date(), updated_at: new Date() })
    ids.set(value, id)
  }
  return ids
}

export type SellerAction = "accept_return" | "refund_only" | "dispute"

const sendsBack = (c: any) => (c.reasons as ReasonCode[]).some((r) => RETURN_REASONS[r]?.sendBack)

/** Approves the request: Mercur opens the return on the order and takes it off the seller's payout. */
async function approve(container: any, c: any, by: "seller" | "auto" | "admin", actorId: string | null, note: string | null) {
  const stamp = by === "admin"
    ? { admin_reviewer_id: actorId, admin_review_date: new Date(), admin_reviewer_note: note }
    : { vendor_reviewer_id: actorId, vendor_review_date: new Date(), vendor_reviewer_note: note ?? (by === "auto" ? "Approved automatically: no answer within 48 hours" : null) }
  const request = await (container.resolve("order_return") as any).retrieveOrderReturnRequest(c.request_id)
  if (request.status === "refunded") return
  try {
    await updateOrderReturnRequestWorkflow.run({
      container,
      input: { id: c.request_id, status: "refunded", ...stamp, location_id: (await primaryLocationId(container, c.seller_id)) ?? undefined } as any,
    })
  } catch (error) {
    // Medusa can't open a return for items it never saw delivered (a lost parcel): the decision still stands
    console.warn(`[return-cases] no Medusa return for ${c.request_id}: ${(error as any)?.message ?? error}`)
    await setRequest(container, c.request_id, { status: "refunded", ...stamp })
  }
}

/** Seller's answer within 48 hours: take it back, refund without a return, or dispute with proof. */
export async function sellerResponds(
  container: any,
  sellerId: string,
  requestId: string,
  body: { action?: string; note?: string; evidence?: string[]; instructions?: string },
  actorId: string | null
): Promise<{ stage: Stage } | { error: string; status: number }> {
  const pg = pgOf(container)
  const c = await getCase(pg, requestId)
  if (!c || c.seller_id !== sellerId) return { error: "Return request not found", status: 404 }
  if (c.stage !== "seller_review") return { error: "This return has already been answered.", status: 409 }
  const action = body.action as SellerAction
  const note = text(body.note)

  if (action === "dispute") {
    const ids = Array.isArray(body.evidence) ? body.evidence.filter((e) => typeof e === "string").slice(0, 10) : []
    const proof = ids.length
      ? await pg("return_evidence").whereIn("id", ids).where({ owner_type: "seller", owner_id: sellerId }).select("id", "kind")
      : []
    if (note.length < 10) return { error: "Explain why you dispute the claim. The buyer and Maretinda will read it.", status: 400 }
    if (!proof.length || proof.length !== ids.length) {
      return { error: "Add your proof: a packing photo or video, or the courier's handover record.", status: 400 }
    }
    await setRequest(container, requestId, { status: "withdrawn", vendor_reviewer_id: actorId, vendor_reviewer_note: note, vendor_review_date: new Date() })
    await pg("return_evidence").whereIn("id", ids).update({ request_id: requestId })
    await setCase(pg, requestId, { stage: "declined", seller_note: note, seller_evidence: JSON.stringify(proof) })
    await caseEmails(container, requestId, "disputed")
    return { stage: "declined" }
  }
  if (action !== "accept_return" && action !== "refund_only") return { error: "Choose how to answer: take it back, refund only, or dispute.", status: 400 }
  return accept(container, c, action === "refund_only" || !sendsBack(c) ? "refund_only" : "return_refund", "seller", actorId, note || null, text(body.instructions))
}

async function accept(
  container: any,
  c: any,
  resolution: "refund_only" | "return_refund",
  by: "seller" | "auto" | "admin",
  actorId: string | null,
  note: string | null,
  instructions?: string
): Promise<{ stage: Stage }> {
  const pg = pgOf(container)
  await approve(container, c, by, actorId, note)
  const now = new Date()
  if (resolution === "refund_only") {
    await setCase(pg, c.request_id, { resolution, approved_at: now, approved_by: by, seller_note: note ?? c.seller_note, fault: c.fault ?? "seller" })
    await createCaseRefund(container, c.request_id)
    await caseEmails(container, c.request_id, by === "auto" ? "auto_approved" : "refund_only")
    return { stage: "refund_due" }
  }
  await setCase(pg, c.request_id, {
    stage: "awaiting_return",
    resolution,
    approved_at: now,
    approved_by: by,
    seller_note: note ?? c.seller_note,
    ship_back_by: new Date(now.getTime() + SHIP_BACK_DAYS * DAY),
    return_instructions: instructions || null,
    fault: c.fault ?? "seller",
  })
  await caseEmails(container, c.request_id, by === "auto" ? "auto_approved" : "accepted")
  return { stage: "awaiting_return" }
}

/** The buyer sent it back: courier, tracking number, and what they paid if they paid. */
export async function buyerShipped(
  container: any,
  customerId: string,
  requestId: string,
  body: { courier?: string; tracking_number?: string; fee?: unknown }
): Promise<{ stage: Stage } | { error: string; status: number }> {
  const pg = pgOf(container)
  const c = await getCase(pg, requestId)
  if (!c || c.customer_id !== customerId) return { error: "Return request not found", status: 404 }
  if (c.stage !== "awaiting_return") return { error: "This return isn't waiting for you to send it back.", status: 409 }
  const courier = text(body.courier, 60)
  const tracking = text(body.tracking_number, 60)
  const fee = body.fee === undefined || body.fee === null || body.fee === "" ? 0 : Number(body.fee)
  if (!courier || tracking.length < 4) return { error: "Enter the courier and the tracking number from your receipt.", status: 400 }
  if (!Number.isFinite(fee) || fee < 0 || fee > 2000) return { error: "Enter what you paid to send it, between ₱0 and ₱2,000.", status: 400 }
  await setCase(pg, requestId, { stage: "in_transit", return_courier: courier, return_tracking: tracking, return_shipping: fee || null, shipped_back_at: new Date() })
  await caseEmails(container, requestId, "shipped_back")
  return { stage: "in_transit" }
}

/** The seller got the parcel back. "ok" starts the refund; "dispute" sends it to Maretinda with proof. */
export async function sellerReceived(
  container: any,
  sellerId: string,
  requestId: string,
  body: { outcome?: string; note?: string; evidence?: string[] }
): Promise<{ stage: Stage } | { error: string; status: number }> {
  const pg = pgOf(container)
  const c = await getCase(pg, requestId)
  if (!c || c.seller_id !== sellerId) return { error: "Return request not found", status: 404 }
  if (!["awaiting_return", "in_transit", "inspecting"].includes(c.stage)) return { error: "This return isn't on its way back to you.", status: 409 }
  if (body.outcome === "ok") {
    await setCase(pg, requestId, { received_at: c.received_at ?? new Date() })
    await createCaseRefund(container, requestId)
    await caseEmails(container, requestId, "received_ok")
    return { stage: "refund_due" }
  }
  if (body.outcome === "dispute") {
    const note = text(body.note)
    const ids = Array.isArray(body.evidence) ? body.evidence.filter((e) => typeof e === "string").slice(0, 10) : []
    const proof = ids.length ? await pg("return_evidence").whereIn("id", ids).where({ owner_type: "seller", owner_id: sellerId }).select("id", "kind") : []
    if (note.length < 10 || !proof.length || proof.length !== ids.length) {
      return { error: "Say what is wrong with the returned item, with photos of it as it arrived.", status: 400 }
    }
    await pg("return_evidence").whereIn("id", ids).update({ request_id: requestId })
    const seller_evidence = JSON.stringify([...(c.seller_evidence ?? []), ...proof])
    await escalate(container, c, "seller", note, { received_at: c.received_at ?? new Date(), seller_evidence })
    return { stage: "escalated" }
  }
  // Just "it arrived": 48 hours to look it over
  await setCase(pg, requestId, { stage: "inspecting", received_at: new Date(), inspect_by: new Date(Date.now() + INSPECTION_HOURS * HOUR) })
  return { stage: "inspecting" }
}

async function escalate(container: any, c: any, by: "buyer" | "seller", note: string, extra: Record<string, unknown> = {}) {
  const pg = pgOf(container)
  const now = new Date()
  await setRequest(container, c.request_id, { status: "escalated" })
  await setCase(pg, c.request_id, {
    stage: "escalated",
    escalated_at: now,
    escalated_by: by,
    decide_by: new Date(now.getTime() + DISPUTE_DECISION_DAYS * DAY),
    ...(by === "buyer" ? { buyer_note: [c.buyer_note, note].filter(Boolean).join("\n\n") } : { seller_note: note }),
    ...extra,
  })
  await caseEmails(container, c.request_id, "escalated")
}

/** After a seller disputes the claim, the buyer may ask Maretinda to decide. */
export async function buyerEscalates(container: any, customerId: string, requestId: string, body: { note?: string }) {
  const pg = pgOf(container)
  const c = await getCase(pg, requestId)
  if (!c || c.customer_id !== customerId) return { error: "Return request not found", status: 404 }
  if (c.stage !== "declined") return { error: "Only a return the seller disputed can be sent to Maretinda.", status: 409 }
  const note = text(body.note)
  if (note.length < 10) return { error: "Tell us why you disagree with the seller.", status: 400 }
  await escalate(container, c, "buyer", note)
  return { stage: "escalated" as Stage }
}

/** Maretinda's binding decision on an escalated return (Internal Redress Mechanism, RA 11967 s. 24). */
export async function adminDecides(
  container: any,
  requestId: string,
  body: { decision?: string; fault?: string; note?: string; resolution?: string },
  adminId: string
): Promise<{ stage: Stage } | { error: string; status: number }> {
  const pg = pgOf(container)
  const c = await getCase(pg, requestId)
  if (!c) return { error: "Return request not found", status: 404 }
  if (c.stage !== "escalated") return { error: "Only an escalated return can be decided here.", status: 409 }
  const note = text(body.note)
  if (!note) return { error: "Add a note: the buyer and seller see why.", status: 400 }
  if (body.decision === "reject") {
    await setRequest(container, requestId, { status: "canceled", admin_reviewer_id: adminId, admin_reviewer_note: note, admin_review_date: new Date() })
    await setCase(pg, requestId, { stage: "closed", decision_note: note, closed_at: new Date() })
    await caseEmails(container, requestId, "rejected")
    return { stage: "closed" }
  }
  if (body.decision !== "refund") return { error: "Decide: refund the buyer, or reject the claim.", status: 400 }
  const fault: Fault = body.fault === "courier" || body.fault === "buyer" ? body.fault : "seller"
  await setCase(pg, requestId, { decision_note: note, fault })
  const fresh = await getCase(pg, requestId)
  // The item already came back (the seller disputed its condition), or nothing needs to come back
  if (c.received_at || body.resolution === "refund_only" || !sendsBack(c)) {
    await approve(container, fresh, "admin", adminId, note)
    await setCase(pg, requestId, { resolution: c.resolution ?? "refund_only", approved_at: c.approved_at ?? new Date(), approved_by: c.approved_by ?? "admin" })
    await createCaseRefund(container, requestId)
    await caseEmails(container, requestId, "decided_refund")
    return { stage: "refund_due" }
  }
  return accept(container, fresh, "return_refund", "admin", adminId, note)
}

/** The refund for a return, from the policy's fee table. Idempotent. */
export async function createCaseRefund(container: any, requestId: string) {
  const pg = pgOf(container)
  const c = await getCase(pg, requestId)
  if (!c) return null
  const existing = await pg("buyer_refund").where("request_id", requestId).whereNot("status", "void").first()
  if (existing) {
    await setCase(pg, requestId, { stage: existing.status === "paid" ? "refunded" : "refund_due" })
    return existing
  }
  const facts = await orderFacts(pg, c.order_id)
  const lines = await pg("order_return_request_line_item").where("return_request_id", requestId).whereNull("deleted_at").select("line_item_id", "quantity")
  let items = 0
  let full = true
  for (const [id, ordered] of facts.items) {
    const back = lines.find((l: any) => l.line_item_id === id)
    const qty = Number(back?.quantity ?? 0)
    items += ordered.unit_price * qty
    if (qty < ordered.quantity) full = false
  }
  const plan = planRefund({
    kind: "return",
    fault: (c.fault as Fault) ?? "seller",
    payment: c.payment,
    items,
    shipping: facts.shipping,
    full,
    order_total: facts.total,
    return_shipping: Number(c.return_shipping ?? 0),
  })
  const refund = await recordRefund(container, {
    kind: "return",
    order_id: c.order_id,
    seller_id: c.seller_id,
    customer_id: c.customer_id,
    request_id: requestId,
    payment: c.payment,
    fault: c.fault ?? "seller",
    plan,
    payout_enc: c.payout_enc,
    payout_label: c.payout_label,
  })
  await setCase(pg, requestId, { stage: "refund_due" })
  return refund
}

type RecordInput = {
  kind: RefundKind
  order_id: string
  seller_id: string
  customer_id: string | null
  request_id?: string | null
  payment: "online" | "cod"
  fault: Fault
  plan: ReturnType<typeof planRefund>
  payout_enc?: string | null
  payout_label?: string | null
  note?: string | null
}

/** Whether the shop was already paid for this order, so the refund has to come back from it later. */
async function sellerAlreadyPaid(pg: any, orderId: string, payment: "online" | "cod"): Promise<boolean> {
  if (payment === "online") {
    return !!(await pg("settlement_line").where("order_id", orderId).whereNot("kind", "legacy").first("transaction_id"))
  }
  return !!(await pg("seller_shipping_order").where("medusa_order_id", orderId).whereNotNull("cod_paid_at").whereNull("deleted_at").first("id"))
}

/**
 * A refund the accounting team will pay by hand. What the seller bears beyond
 * the refunded order (return shipping, the processing fee), and the refund
 * itself when the seller was already paid for the order, become charges taken
 * from their next payout (or their security deposit).
 */
export async function recordRefund(container: any, r: RecordInput) {
  const pg = pgOf(container)
  const now = new Date()
  const id = newId("rfd")
  const row = {
    id,
    kind: r.kind,
    order_id: r.order_id,
    seller_id: r.seller_id,
    customer_id: r.customer_id,
    request_id: r.request_id ?? null,
    payment: r.payment,
    fault: r.fault,
    amount: r.plan.amount,
    refunded: JSON.stringify(r.plan.refunded),
    deductions: JSON.stringify(r.plan.deductions),
    seller_charges: JSON.stringify(r.plan.seller_charges),
    status: r.plan.amount > 0 ? "due" : "paid",
    due_by: addBusinessDays(now, r.payment === "online" ? 14 : 5),
    payout_enc: r.payout_enc ?? null,
    payout_label: r.payout_label ?? null,
    note: r.note ?? null,
  }
  await pg("buyer_refund").insert(row)
  const order = await pg("order").where("id", r.order_id).first("display_id")
  const number = `#${order?.display_id ?? r.order_id}`
  const charges = r.plan.seller_charges.map((c) => ({ label: `${c.label}, order ${number}`, amount: c.amount }))
  if (r.plan.amount > 0 && (await sellerAlreadyPaid(pg, r.order_id, r.payment))) {
    charges.unshift({ label: `Refund to the buyer after your payout, order ${number}`, amount: r.plan.amount })
  }
  if (charges.length) {
    await pg("seller_charge").insert(charges.map((c) => ({ id: newId("chg"), seller_id: r.seller_id, order_id: r.order_id, refund_id: id, label: c.label, amount: c.amount })))
  }
  if (row.status === "due") await refundEmails(container, id, "due")
  return row
}

export type PaidInput = { reference: string; method: string; amount: number; paid_at: Date; receipt_id: string | null; note: string | null }

export function parsePaid(body: any): PaidInput | string {
  const reference = text(body?.reference, 100)
  const method = text(body?.method, 40)
  const amount = Math.round(Number(body?.amount) * 100) / 100
  const paidAt = body?.paid_at ? new Date(body.paid_at) : new Date()
  if (!reference) return "Enter the transfer's reference number."
  if (!["instapay", "gcash", "maya", "bank_transfer"].includes(method)) return "Choose how it was sent: InstaPay, GCash, Maya or bank transfer."
  if (!Number.isFinite(amount) || amount <= 0) return "Enter the exact amount sent."
  if (Number.isNaN(paidAt.getTime()) || paidAt.getTime() > Date.now() + DAY) return "Enter the date the transfer was made."
  return { reference, method, amount, paid_at: paidAt, receipt_id: typeof body?.receipt_id === "string" ? body.receipt_id : null, note: text(body?.note, 300) || null }
}

/** Accounting logs a refund as sent: reference, date, exact amount and the receipt. The buyer sees it on their order. */
export async function markRefundPaid(container: any, refundId: string, input: PaidInput, adminId: string) {
  const pg = pgOf(container)
  const refund = await pg("buyer_refund").where("id", refundId).first()
  if (!refund) return { error: "Refund not found", status: 404 }
  if (refund.status !== "due") return { error: "This refund is already logged as paid or was cancelled.", status: 409 }
  if (input.receipt_id && !(await pg("private_document").where("id", input.receipt_id.replace(/^\/admin\/documents\//, "")).first("id"))) {
    return { error: "Upload the transfer receipt again.", status: 400 }
  }
  await pg("buyer_refund")
    .where("id", refundId)
    .update({
      status: "paid",
      paid_at: input.paid_at,
      paid_amount: input.amount,
      paid_method: input.method,
      reference: input.reference,
      receipt_id: input.receipt_id?.replace(/^\/admin\/documents\//, "") ?? null,
      paid_by: adminId,
      note: input.note ?? refund.note,
    })
  if (refund.request_id) await setCase(pg, refund.request_id, { stage: "refunded", closed_at: new Date() })
  if (refund.kind === "cancellation") await pg("cancellation_request").where("refund_id", refundId).update({ status: "approved" })
  await refundEmails(container, refundId, "paid")
  return { id: refundId, status: "paid" }
}

/**
 * The deadlines that move a case on by themselves: no answer from the seller
 * in 48 hours approves it; an inspection with no dispute in 48 hours starts
 * the refund; a return not sent back in time closes; a parcel the seller never
 * confirms is treated as received a week after the buyer's tracking.
 */
export async function runReturnDeadlines(container: any, now = new Date()) {
  const pg = pgOf(container)
  const moved: { request_id: string; to: string }[] = []

  for (const c of await pg("return_case").where("stage", "seller_review").where("respond_by", "<", now)) {
    await accept(container, c, sendsBack(c) ? "return_refund" : "refund_only", "auto", null, null)
    moved.push({ request_id: c.request_id, to: "approved" })
  }
  for (const c of await pg("return_case").where("stage", "inspecting").where("inspect_by", "<", now)) {
    await createCaseRefund(container, c.request_id)
    await caseEmails(container, c.request_id, "received_ok")
    moved.push({ request_id: c.request_id, to: "refund_due" })
  }
  const assume = new Date(now.getTime() - ASSUME_RECEIVED_DAYS * DAY)
  for (const c of await pg("return_case").where("stage", "in_transit").where("shipped_back_at", "<", assume)) {
    await setCase(pg, c.request_id, { stage: "inspecting", received_at: now, inspect_by: new Date(now.getTime() + INSPECTION_HOURS * HOUR) })
    moved.push({ request_id: c.request_id, to: "inspecting" })
  }
  for (const c of await pg("return_case").where("stage", "awaiting_return").where("ship_back_by", "<", now)) {
    await setRequest(container, c.request_id, { status: "canceled", admin_reviewer_note: "Not sent back within 5 days of approval" })
    await setCase(pg, c.request_id, { stage: "closed", closed_at: now, decision_note: "Not sent back within 5 days of approval" })
    await caseEmails(container, c.request_id, "expired")
    moved.push({ request_id: c.request_id, to: "closed" })
  }
  return moved
}

export const STAGE_LABELS: Record<Stage, string> = {
  seller_review: "Waiting for the seller (48 hours)",
  declined: "Seller disputed it",
  escalated: "Maretinda is deciding",
  awaiting_return: "Send the item back",
  in_transit: "On its way back",
  inspecting: "Seller is checking the item",
  refund_due: "Refund being processed",
  refunded: "Refunded",
  closed: "Closed",
}
