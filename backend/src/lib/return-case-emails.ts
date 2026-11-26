import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deliveryStatus } from "./delivery-setup"
import { sellerPanelUrl, sendNotice, storefrontUrl } from "./notify"
import { REFUND_BUSINESS_DAYS } from "./refund-policy"

/**
 * Who hears what as a return moves on. Buyers are told what to do next and by
 * when; sellers get their 48-hour deadlines; refunds come with their proof.
 */

export type CaseEvent =
  | "opened"
  | "disputed"
  | "accepted"
  | "refund_only"
  | "auto_approved"
  | "shipped_back"
  | "received_ok"
  | "escalated"
  | "rejected"
  | "decided_refund"
  | "expired"

const SUPPORT = () => process.env.SUPPORT_NOTIFY_EMAIL || "support@maretinda.com"
const when = (d: any) =>
  new Date(d).toLocaleString("en-PH", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })
const day = (d: any) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })
const peso = (n: any) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

async function facts(container: any, requestId: string) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const c = await pg("return_case").where("request_id", requestId).first()
  if (!c) return null
  const order = await pg("order").where("id", c.order_id).first("id", "display_id", "email")
  const customer = await pg("customer").where("id", c.customer_id).first("first_name", "email")
  const seller = await pg("seller").where("id", c.seller_id).first("name", "email")
  return { pg, c, order, number: `#${order?.display_id ?? c.order_id}`, buyer: { email: order?.email || customer?.email, name: customer?.first_name }, seller }
}

const buyerButton = { label: "See my return", url: `${storefrontUrl()}/user/returns` }
const sellerButton = (requestId: string) => ({ label: "Open the return", url: `${sellerPanelUrl()}/requests/orders/${requestId}/review` })

export async function caseEmails(container: any, requestId: string, event: CaseEvent) {
  try {
    const f = await facts(container, requestId)
    if (!f) return
    const { c, number, buyer, seller } = f
    const toBuyer = (subject: string, heading: string, paragraphs: string[]) =>
      sendNotice(container, { to: buyer.email, subject, eyebrow: "Returns", heading, user_name: buyer.name, paragraphs, button: buyerButton })
    const toSeller = (subject: string, heading: string, paragraphs: string[]) =>
      sendNotice(container, { to: seller?.email, subject, eyebrow: "Returns", heading, user_name: seller?.name, paragraphs, button: sellerButton(requestId) })
    const toSupport = (subject: string, paragraphs: string[]) =>
      sendNotice(container, { to: SUPPORT(), subject, eyebrow: "Returns", heading: subject, user_name: "team", paragraphs })

    switch (event) {
      case "opened":
        await toSeller(`Return requested on order ${number}: answer by ${when(c.respond_by)}`, "A buyer asked for a return", [
          `The buyer of order ${number} asked for a return or refund, with their photos${(c.evidence ?? []).some((e: any) => e.kind === "video") ? " and unboxing video" : ""}.`,
          `Answer by ${when(c.respond_by)}: take it back, refund without a return, or dispute it with your packing proof. If you don't answer in 48 hours, it is approved automatically.`,
        ])
        await toBuyer(`We received your return request for order ${number}`, "Your request was sent to the seller", [
          `${seller?.name ?? "The seller"} has until ${when(c.respond_by)} to answer. If they don't, it is approved automatically.`,
          "We'll email you as soon as there is an answer.",
        ])
        return
      case "disputed":
        await toBuyer(`The seller disputed your return for order ${number}`, "The seller disputed your claim", [
          ...(c.seller_note ? [`Their reason: ${c.seller_note}`] : []),
          "If you disagree, open your return and press Escalate to Maretinda. Our team reviews both sides and decides within 7 days.",
        ])
        return
      case "accepted":
      case "auto_approved": {
        const address = await returnAddress(container, c.seller_id)
        await toBuyer(
          event === "auto_approved" && c.resolution !== "refund_only"
            ? `Your return for order ${number} was approved`
            : c.resolution === "refund_only"
              ? `You'll get a refund for order ${number}`
              : `Send back your return for order ${number}`,
          c.resolution === "refund_only" ? "Your refund was approved" : "Your return was approved",
          c.resolution === "refund_only"
            ? ["You don't need to send anything back. Our accounting team will send your refund and email you the proof."]
            : [
                `Please send the item back by ${day(c.ship_back_by)}, unused and with all its packaging, tags, manuals and freebies.`,
                ...(c.return_instructions ? [`From the seller: ${c.return_instructions}`] : []),
                ...(address ? [`Send it to: ${address}`] : []),
                "Keep the courier's receipt. Then open your return and enter the courier and tracking number, and what you paid to send it: for a valid claim it is added to your refund.",
              ]
        )
        if (event === "auto_approved") {
          await toSeller(`Return on order ${number} approved automatically`, "A return was approved for you", [
            `You didn't answer the return request on order ${number} within 48 hours, so it was approved automatically.`,
            c.resolution === "refund_only" ? "The buyer will be refunded without sending it back." : `The buyer has until ${day(c.ship_back_by)} to send it back.`,
          ])
        }
        return
      }
      case "refund_only":
        await toBuyer(`You'll get a refund for order ${number}`, "Your refund was approved", [
          "The seller approved a refund without a return, so you don't need to send anything back.",
          "Our accounting team will send it and email you the proof.",
        ])
        return
      case "shipped_back":
        await toSeller(`The buyer sent back order ${number}`, "A return is on its way to you", [
          `Courier: ${c.return_courier}. Tracking number: ${c.return_tracking}.`,
          "When it arrives, check it within 48 hours and confirm in the seller panel, or dispute it with photos if it isn't what you sent. With no answer, the refund goes ahead.",
        ])
        return
      case "received_ok":
        await toBuyer(`Your refund for order ${number} is being processed`, "The seller has your return", [
          "The seller received your return. Our accounting team will now send your refund and email you the proof.",
        ])
        return
      case "escalated":
        await toBuyer(`Maretinda is reviewing your return for order ${number}`, "Maretinda is reviewing your return", [
          `Our team will look at the evidence from both sides and decide by ${day(c.decide_by)}. The decision is final within Maretinda; after it, you may still contact the DTI.`,
        ])
        await toSeller(`Maretinda is reviewing the return on order ${number}`, "A return went to Maretinda", [
          `${c.escalated_by === "buyer" ? "The buyer" : "You"} asked Maretinda to decide the return on order ${number}. We'll decide by ${day(c.decide_by)}.`,
          "If you have more proof (packing photos or video, courier handover records), reply to this email.",
        ])
        await toSupport(`Escalated return on order ${number}: decide by ${day(c.decide_by)}`, [
          `Escalated by the ${c.escalated_by}. Decide it in the admin panel under Requests → Returns.`,
        ])
        return
      case "rejected":
        await toBuyer(`Your return for order ${number} was not approved`, "Your return was not approved", [
          ...(c.decision_note ? [`Maretinda's decision: ${c.decision_note}`] : []),
          "If you have new information, reply to support@maretinda.com. You may also contact the DTI.",
        ])
        await toSeller(`Maretinda decided the return on order ${number} in your favour`, "The return was not approved", [
          ...(c.decision_note ? [`Maretinda's decision: ${c.decision_note}`] : []),
        ])
        return
      case "decided_refund":
        await toBuyer(`Your return for order ${number} was approved`, "Maretinda approved your refund", [
          ...(c.decision_note ? [`Maretinda's decision: ${c.decision_note}`] : []),
          "Our accounting team will send your refund and email you the proof.",
        ])
        await toSeller(`Maretinda approved the return on order ${number}`, "The return was approved", [
          ...(c.decision_note ? [`Maretinda's decision: ${c.decision_note}`] : []),
          "The refund comes off your payout for this order.",
        ])
        return
      case "expired":
        await toBuyer(`Your return for order ${number} was closed`, "Your return was closed", [
          `It wasn't sent back by ${day(c.ship_back_by)}, so the return was closed. If something prevented you, write to support@maretinda.com.`,
        ])
        await toSeller(`The return on order ${number} was closed`, "A return was closed", ["The buyer didn't send it back in time, so nothing is refunded."])
        return
    }
  } catch (error) {
    console.error(`[return-case-emails] ${event} for ${requestId} failed:`, error instanceof Error ? error.message : error)
  }
}

/** Where the buyer sends a return: the shop's pickup address. */
async function returnAddress(container: any, sellerId: string): Promise<string | null> {
  const status = await deliveryStatus(container, sellerId).catch(() => null)
  const l = status?.location
  if (!l?.address_1) return null
  return [l.name, l.address_1, l.address_2, l.city, l.province, l.postal_code, l.phone].filter(Boolean).join(", ")
}

export async function refundEmails(container: any, refundId: string, event: "due" | "paid") {
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const r = await pg("buyer_refund").where("id", refundId).first()
    if (!r) return
    const order = await pg("order").where("id", r.order_id).first("display_id", "email")
    const customer = r.customer_id ? await pg("customer").where("id", r.customer_id).first("first_name", "email") : null
    const seller = await pg("seller").where("id", r.seller_id).first("name", "email")
    const number = `#${order?.display_id ?? r.order_id}`
    const [from, to] = REFUND_BUSINESS_DAYS[r.payment as "online" | "cod"]
    const deductions = (typeof r.deductions === "string" ? JSON.parse(r.deductions) : r.deductions) ?? []
    if (event === "due") {
      await sendNotice(container, {
        to: order?.email || customer?.email,
        subject: `Your refund of ${peso(r.amount)} for order ${number}`,
        eyebrow: "Refunds",
        heading: "Your refund is on its way",
        user_name: customer?.first_name,
        paragraphs: [
          `We'll send ${peso(r.amount)} to ${r.payout_label ?? "your account"} within ${from}–${to} business days, by ${day(r.due_by)} at the latest.`,
          ...(deductions.length ? [`Taken off: ${deductions.map((d: any) => `${d.label} ${peso(d.amount)}`).join("; ")}.`] : []),
          "When it is sent you'll get the reference number, date and receipt.",
        ],
        button: { label: "See my orders", url: `${storefrontUrl()}/user/orders` },
      })
      await sendNotice(container, {
        to: SUPPORT(),
        subject: `Refund due: ${peso(r.amount)} for order ${number}, by ${day(r.due_by)}`,
        eyebrow: "Refunds",
        heading: "A refund is due",
        user_name: "accounting team",
        paragraphs: [`Send it and log the proof in the admin panel under Refunds.`],
      })
      return
    }
    const receipt = r.receipt_id ? await pg("private_document").where("id", r.receipt_id).first("file_name", "content_type", "content") : null
    await sendNotice(container, {
      to: order?.email || customer?.email,
      subject: `Refunded: ${peso(r.paid_amount)} for order ${number}`,
      eyebrow: "Refunds",
      heading: "Your refund was sent",
      user_name: customer?.first_name,
      paragraphs: [
        `We sent ${peso(r.paid_amount)} to ${r.payout_label ?? "your account"} on ${day(r.paid_at)}.`,
        `Reference number: ${r.reference}.`,
        receipt ? "The transfer receipt is attached." : "The details are also on your order page.",
        "If it hasn't arrived within 2 business days, reply to support@maretinda.com with the reference number.",
      ],
      button: { label: "See my orders", url: `${storefrontUrl()}/user/orders` },
      ...(receipt
        ? { attachments: [{ filename: receipt.file_name, content: Buffer.from(receipt.content).toString("base64"), content_type: receipt.content_type, disposition: "attachment" }] }
        : {}),
    })
    await sendNotice(container, {
      to: seller?.email,
      subject: `Maretinda refunded the buyer of order ${number}`,
      eyebrow: "Refunds",
      heading: "A buyer was refunded",
      user_name: seller?.name,
      paragraphs: [`Maretinda sent ${peso(r.paid_amount)} to the buyer of order ${number} (reference ${r.reference}).`, "It is taken off your payout for this order, or your next payout if you were already paid."],
      button: { label: "See your payouts", url: `${sellerPanelUrl()}/invoices` },
    })
  } catch (error) {
    console.error(`[return-case-emails] refund ${event} for ${refundId} failed:`, error instanceof Error ? error.message : error)
  }
}
