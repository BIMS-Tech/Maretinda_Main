import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deliveryStatus } from "./delivery-setup"
import { REFUND_BUSINESS_DAYS, RETURN_REASONS, ReasonCode } from "./refund-policy"
import { openPayout, STAGE_LABELS, Stage } from "./return-cases"

const parse = (v: any) => (typeof v === "string" ? JSON.parse(v) : v ?? [])

/** A refund as each side may see it. Only admins see full account details. */
export function refundView(r: any, audience: "buyer" | "seller" | "admin") {
  if (!r) return null
  return {
    id: r.id,
    kind: r.kind,
    status: r.status,
    amount: Number(r.amount),
    refunded: parse(r.refunded),
    deductions: parse(r.deductions),
    ...(audience !== "buyer" ? { seller_charges: parse(r.seller_charges), fault: r.fault } : {}),
    due_by: r.due_by,
    business_days: REFUND_BUSINESS_DAYS[r.payment as "online" | "cod"],
    payout_label: audience === "seller" ? null : r.payout_label,
    ...(audience === "admin" ? { payout: openPayout(r.payout_enc), note: r.note, paid_by: r.paid_by } : {}),
    paid_at: r.paid_at,
    paid_amount: r.paid_amount === null ? null : Number(r.paid_amount),
    paid_method: r.paid_method,
    reference: r.reference,
    has_receipt: !!r.receipt_id,
  }
}

/** A return case for the buyer, the seller or an admin. */
export async function caseView(container: any, c: any, audience: "buyer" | "seller" | "admin") {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const refund = await pg("buyer_refund").where("request_id", c.request_id).whereNot("status", "void").orderBy("created_at", "desc").first()
  const order = await pg("order").where("id", c.order_id).first("display_id")
  const items = await pg("order_return_request_line_item as rli")
    .join("order_line_item as li", "li.id", "rli.line_item_id")
    .leftJoin("return_reason as rr", "rr.id", "rli.reason_id")
    .where("rli.return_request_id", c.request_id)
    .whereNull("rli.deleted_at")
    .select("li.title", "li.variant_title", "li.thumbnail", "li.unit_price", "rli.quantity", "rr.label as reason")
  const location = ["awaiting_return", "in_transit"].includes(c.stage) && audience === "buyer" ? (await deliveryStatus(container, c.seller_id).catch(() => null))?.location : null
  return {
    request_id: c.request_id,
    order_id: c.order_id,
    order_number: order?.display_id ?? null,
    stage: c.stage as Stage,
    stage_label: STAGE_LABELS[c.stage as Stage],
    payment: c.payment,
    reasons: parse(c.reasons).map((r: ReasonCode) => ({ code: r, label: RETURN_REASONS[r]?.label ?? r })),
    items: items.map((i: any) => ({ ...i, unit_price: Number(i.unit_price), quantity: Number(i.quantity) })),
    evidence: parse(c.evidence),
    seller_evidence: parse(c.seller_evidence),
    buyer_note: c.buyer_note,
    seller_note: c.seller_note,
    decision_note: c.decision_note,
    resolution: c.resolution,
    respond_by: c.respond_by,
    approved_at: c.approved_at,
    approved_by: c.approved_by,
    ship_back_by: c.ship_back_by,
    return_instructions: c.return_instructions,
    return_address: location
      ? [location.name, location.address_1, location.address_2, location.city, location.province, location.postal_code, location.phone].filter(Boolean).join(", ")
      : null,
    return_courier: c.return_courier,
    return_tracking: c.return_tracking,
    return_shipping: c.return_shipping === null ? null : Number(c.return_shipping),
    shipped_back_at: c.shipped_back_at,
    received_at: c.received_at,
    inspect_by: c.inspect_by,
    escalated_at: c.escalated_at,
    escalated_by: c.escalated_by,
    decide_by: c.decide_by,
    closed_at: c.closed_at,
    created_at: c.created_at,
    payout_label: audience === "seller" ? null : c.payout_label,
    ...(audience === "admin" ? { payout: openPayout(c.payout_enc), fault: c.fault, seller_id: c.seller_id, customer_id: c.customer_id } : {}),
    refund: refundView(refund, audience),
  }
}
