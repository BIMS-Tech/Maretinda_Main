import crypto from "crypto"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { cancelOrderFulfillmentWorkflow, cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { sendNotice, sellerPanelUrl } from "./notify"
import { cancellationRefusal, Fault, parsePayout, planRefund } from "./refund-policy"
import { paymentOf, recordRefund, sealPayout } from "./return-cases"

/**
 * Paid-online orders: the buyer asks support to cancel before shipment, and
 * loses only the gateway's fee. Any paid order that gets cancelled, by
 * whoever, gets a refund the accounting team pays. Failed deliveries the
 * buyer caused are refunded less shipping and fees, and repeat COD offenders
 * lose COD.
 */

const pgOf = (container: any) => container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
const SUPPORT = () => process.env.SUPPORT_NOTIFY_EMAIL || "support@maretinda.com"
const newId = (p: string) => `${p}_${crypto.randomBytes(10).toString("hex")}`

/** Was this order paid through GiyaPay (money Maretinda now holds)? */
async function paidOnline(pg: any, orderId: string): Promise<boolean> {
  if ((await paymentOf(pg, orderId)) !== "online") return false
  const captured = await pg("order_payment_collection as opc")
    .join("payment_collection as pc", "pc.id", "opc.payment_collection_id")
    .where("opc.order_id", orderId)
    .whereNull("opc.deleted_at")
    .where((q: any) => q.where("pc.captured_amount", ">", 0).orWhere("pc.authorized_amount", ">", 0))
    .first("pc.id")
  return !!captured
}

async function orderTotals(pg: any, orderId: string) {
  const summary = await pg("order_summary").where("order_id", orderId).whereNull("deleted_at").orderBy("version", "desc").first("totals")
  const totals = typeof summary?.totals === "string" ? JSON.parse(summary.totals) : summary?.totals
  const shipping = await pg("order_shipping as os")
    .join("order_shipping_method as sm", "sm.id", "os.shipping_method_id")
    .where("os.order_id", orderId)
    .whereNull("os.deleted_at")
    .sum("sm.amount as total")
    .first()
  // A cancelled order's "current" total is 0; what was paid is the original
  return { total: Number(totals?.original_order_total ?? totals?.current_order_total ?? 0), shipping: Number(shipping?.total ?? 0) }
}

export async function requestCancellation(container: any, customerId: string, body: any) {
  const pg = pgOf(container)
  const order = await pg("order").where({ id: String(body?.order_id ?? ""), customer_id: customerId }).whereNull("deleted_at").first("id", "display_id", "status", "canceled_at", "email")
  if (!order) return { error: "Order not found", status: 404 }
  const shipped = await pg("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .where("of.order_id", order.id)
    .whereNull("of.deleted_at")
    .whereNull("f.canceled_at")
    .whereNotNull("f.shipped_at")
    .first("f.id")
  const refused = cancellationRefusal({ shipped: !!shipped, canceled: order.status === "canceled" || !!order.canceled_at })
  if (refused) return { error: refused, status: 409 }
  if (!(await paidOnline(pg, order.id))) {
    return { error: "This order isn't paid online. You can cancel it yourself from the order page while the seller hasn't started on it.", status: 409 }
  }
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : ""
  if (reason.length < 3) return { error: "Tell us why you want to cancel.", status: 400 }
  const payout = parsePayout(body?.payout)
  if (typeof payout === "string") return { error: payout, status: 400 }
  if (await pg("cancellation_request").where({ order_id: order.id, status: "pending" }).first("id")) {
    return { error: "You already asked to cancel this order. We'll email you the answer.", status: 409 }
  }
  const link = await pg("seller_seller_order_order").where("order_id", order.id).whereNull("deleted_at").first("seller_id")
  const id = newId("ccl")
  await pg("cancellation_request").insert({ id, order_id: order.id, seller_id: link?.seller_id ?? "", customer_id: customerId, reason, ...sealPayout(payout) })
  const number = `#${order.display_id ?? order.id}`
  await sendNotice(container, {
    to: SUPPORT(),
    subject: `Cancellation requested for paid order ${number}`,
    eyebrow: "Cancellations",
    heading: "A buyer wants to cancel a paid order",
    user_name: "team",
    paragraphs: [`Reason: ${reason}`, "Check with the seller that it hasn't shipped, then approve or reject it in the admin panel under Cancellations."],
  })
  const seller = link ? await pg("seller").where("id", link.seller_id).first("name", "email") : null
  await sendNotice(container, {
    to: seller?.email,
    subject: `Hold order ${number}: the buyer asked to cancel`,
    eyebrow: "Cancellations",
    heading: "Please don't ship this order yet",
    user_name: seller?.name,
    paragraphs: [`The buyer of order ${number} asked Maretinda to cancel it. Please hold it until we confirm. If it has already shipped, reply to this email.`],
    button: { label: "Open the order", url: `${sellerPanelUrl()}/orders/${order.id}` },
  })
  await sendNotice(container, {
    to: order.email,
    subject: `We received your cancellation request for order ${number}`,
    eyebrow: "Cancellations",
    heading: "We're on it",
    paragraphs: [
      "We've asked the seller to hold your order and will confirm by email.",
      "If it is cancelled, you get back what you paid less the payment processing fee, which the payment provider doesn't return.",
    ],
  })
  return { id }
}

export async function decideCancellation(container: any, id: string, body: any, adminId: string) {
  const pg = pgOf(container)
  const request = await pg("cancellation_request").where("id", id).first()
  if (!request) return { error: "Cancellation request not found", status: 404 }
  if (request.status !== "pending") return { error: "This request was already decided.", status: 409 }
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : ""
  const order = await pg("order").where("id", request.order_id).first("id", "display_id", "email", "status")
  const number = `#${order?.display_id ?? request.order_id}`
  if (body?.decision === "reject") {
    if (!note) return { error: "Say why, for the buyer.", status: 400 }
    await pg("cancellation_request").where("id", id).update({ status: "rejected", decided_by: adminId, decided_at: new Date(), decision_note: note })
    await sendNotice(container, {
      to: order?.email,
      subject: `Your order ${number} can't be cancelled`,
      eyebrow: "Cancellations",
      heading: "We couldn't cancel your order",
      paragraphs: [note, "Once it arrives you can ask for a return if something is wrong."],
    })
    return { status: "rejected" }
  }
  if (body?.decision !== "approve") return { error: "Approve or reject the request.", status: 400 }

  // A booking made but not yet picked up is undone first; Medusa won't cancel an order with live fulfilments
  const open = await pg("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .where("of.order_id", request.order_id)
    .whereNull("of.deleted_at")
    .whereNull("f.canceled_at")
    .select("f.id", "f.shipped_at")
  if (open.some((f: any) => f.shipped_at)) return { error: "It has already shipped, so it can't be cancelled. Reject the request.", status: 409 }
  for (const f of open) {
    await cancelOrderFulfillmentWorkflow(container).run({ input: { order_id: request.order_id, fulfillment_id: f.id, no_notification: true } as any })
  }
  await pg("cancellation_request").where("id", id).update({ status: "approved", decided_by: adminId, decided_at: new Date(), decision_note: note || null })
  if (order?.status !== "canceled") {
    await cancelOrderWorkflow(container).run({ input: { order_id: request.order_id, canceled_by: adminId } })
  }
  const refund = await refundForCanceledOrder(container, request.order_id)
  if (refund) await pg("cancellation_request").where("id", id).update({ refund_id: refund.id })
  return { status: "approved", refund_id: refund?.id ?? null }
}

/**
 * A cancelled order that was paid online gets a refund for the accounting team
 * to send. The buyer bears the fee only when they asked to cancel. Idempotent:
 * safe from both the admin's approval and the order.canceled event.
 */
export async function refundForCanceledOrder(container: any, orderId: string) {
  const pg = pgOf(container)
  if (await pg("buyer_refund").where({ order_id: orderId, kind: "cancellation" }).whereNot("status", "void").first("id")) return null
  if (!(await paidOnline(pg, orderId))) return null
  const order = await pg("order").where("id", orderId).first("id", "customer_id")
  const link = await pg("seller_seller_order_order").where("order_id", orderId).whereNull("deleted_at").first("seller_id")
  if (!order || !link) return null
  const asked = await pg("cancellation_request").where({ order_id: orderId, status: "approved" }).orderBy("created_at", "desc").first()
  const fault: Fault = asked ? "buyer" : "seller"
  const t = await orderTotals(pg, orderId)
  const plan = planRefund({ kind: "cancellation", fault, payment: "online", items: t.total - t.shipping, shipping: t.shipping, full: true, order_total: t.total })
  return recordRefund(container, {
    kind: "cancellation",
    order_id: orderId,
    seller_id: link.seller_id,
    customer_id: order.customer_id,
    payment: "online",
    fault,
    plan,
    payout_enc: asked?.payout_enc ?? null,
    payout_label: asked?.payout_label ?? null,
  })
}

/** Couriers' failed deliveries the buyer caused: wrong address, unreachable, or refused. */
export async function recordFailedDelivery(container: any, orderId: string, body: any, adminId: string) {
  const pg = pgOf(container)
  const order = await pg("order").where("id", orderId).whereNull("deleted_at").first("id", "customer_id", "email")
  if (!order) return { error: "Order not found", status: 404 }
  if (await pg("failed_delivery").where("order_id", orderId).first("order_id")) return { error: "This failed delivery is already recorded.", status: 409 }
  const rts = body?.rts_fee === undefined || body?.rts_fee === "" ? 0 : Number(body.rts_fee)
  if (!Number.isFinite(rts) || rts < 0 || rts > 5000) return { error: "Enter the courier's return-to-sender fee, or 0.", status: 400 }
  const payment = await paymentOf(pg, orderId)
  await pg("failed_delivery").insert({ order_id: orderId, customer_id: order.customer_id, email: order.email?.toLowerCase() ?? null, payment, rts_fee: rts || null, recorded_by: adminId })
  if (payment !== "online" || !(await paidOnline(pg, orderId))) return { refund: null }
  const link = await pg("seller_seller_order_order").where("order_id", orderId).whereNull("deleted_at").first("seller_id")
  const t = await orderTotals(pg, orderId)
  const plan = planRefund({ kind: "failed_delivery", fault: "buyer", payment, items: t.total - t.shipping, shipping: t.shipping, full: true, order_total: t.total, rts_fee: rts })
  const refund = await recordRefund(container, { kind: "failed_delivery", order_id: orderId, seller_id: link?.seller_id, customer_id: order.customer_id, payment, fault: "buyer", plan })
  return { refund: refund.id }
}

export const codRtsLimit = () => {
  const n = Number(process.env.COD_RTS_LIMIT)
  return Number.isInteger(n) && n > 0 ? n : 2
}

/** Buyers with repeated failed COD deliveries can't choose COD again (policy 1.5). */
export async function codBlocked(pg: any, customerId: string | null, email: string | null): Promise<boolean> {
  if (!customerId && !email) return false
  const row = await pg("failed_delivery")
    .where("payment", "cod")
    .where((q: any) => {
      if (customerId) q.orWhere("customer_id", customerId)
      if (email) q.orWhere("email", email.toLowerCase())
    })
    .count("order_id as n")
    .first()
  return Number(row?.n ?? 0) >= codRtsLimit()
}

/** Where to send a refund that has no account yet (a cancellation the shop made, a failed delivery). */
export async function addRefundPayout(container: any, customerId: string, refundId: string, body: any) {
  const pg = pgOf(container)
  const refund = await pg("buyer_refund").where({ id: refundId, customer_id: customerId }).first("id", "status")
  if (!refund) return { error: "Refund not found", status: 404 }
  if (refund.status !== "due") return { error: "This refund was already sent.", status: 409 }
  const payout = parsePayout(body?.payout)
  if (typeof payout === "string") return { error: payout, status: 400 }
  await pg("buyer_refund").where("id", refundId).update(sealPayout(payout))
  return { payout_label: sealPayout(payout).payout_label }
}
