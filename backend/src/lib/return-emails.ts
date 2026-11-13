import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendNotice, sellerPanelUrl, storefrontUrl } from "./notify"

type Party = "buyer" | "seller"

type ReturnEmail = {
  to: Party
  subject: string
  heading: string
  paragraphs: string[]
}

type ReturnFacts = {
  status: string
  orderNumber: string
  sellerName: string
  sellerNote?: string | null
  adminNote?: string | null
}

const noted = (label: string, note?: string | null) => (note?.trim() ? [`${label}: ${note.trim()}`] : [])

/**
 * Who hears what when a return request reaches a status. Refund wording stays
 * general: how the money goes back is agreed with the buyer by support.
 */
export function returnEmails(f: ReturnFacts): ReturnEmail[] {
  const order = `order #${f.orderNumber}`
  switch (f.status) {
    case "pending":
      return [
        {
          to: "seller",
          subject: `Return requested on ${order}`,
          heading: "A buyer asked to return an order",
          paragraphs: [
            `A buyer has asked to return items from ${order}.`,
            "Open the return in your seller panel to accept it, decline it with a reason, or pass it to Maretinda to decide.",
          ],
        },
        {
          to: "buyer",
          subject: `We received your return request for ${order}`,
          heading: "Your return request was sent",
          paragraphs: [
            `${f.sellerName} has been asked to review your return for ${order}.`,
            "You will get an email as soon as there is a decision.",
          ],
        },
      ]
    case "refunded":
      return [
        {
          to: "buyer",
          subject: `Your return for ${order} was approved`,
          heading: "Your return was approved",
          paragraphs: [
            `Your return for ${order} from ${f.sellerName} has been approved.`,
            ...noted("Note from the seller", f.sellerNote),
            ...noted("Note from Maretinda", f.adminNote),
            "Maretinda support will contact you about sending the items back and your refund. If you do not hear from us within 2 working days, write to support@maretinda.com.",
          ],
        },
        ...(f.adminNote
          ? [
              {
                to: "seller" as const,
                subject: `Maretinda approved the return on ${order}`,
                heading: "The escalated return was approved",
                paragraphs: [`Maretinda reviewed the return you escalated on ${order} and approved it.`, ...noted("Note from Maretinda", f.adminNote)],
              },
            ]
          : []),
      ]
    case "withdrawn":
      return [
        {
          to: "buyer",
          subject: `Your return for ${order} was declined`,
          heading: "Your return was declined",
          paragraphs: [
            `${f.sellerName} declined your return for ${order}.`,
            ...noted("Reason", f.sellerNote),
            "If you disagree with this decision, write to support@maretinda.com and we will look into it.",
          ],
        },
      ]
    case "escalated":
      return [
        {
          to: "buyer",
          subject: `Your return for ${order} is with Maretinda`,
          heading: "Maretinda is reviewing your return",
          paragraphs: [
            `${f.sellerName} asked Maretinda to decide your return for ${order}.`,
            ...noted("Note from the seller", f.sellerNote),
            "Our team will review it and email you the decision.",
          ],
        },
      ]
    case "canceled":
      return [
        {
          to: "buyer",
          subject: `Your return for ${order} was not approved`,
          heading: "Your return was not approved",
          paragraphs: [
            `Maretinda reviewed your return for ${order} and could not approve it.`,
            ...noted("Reason", f.adminNote),
            "If you have more information to share, reply to support@maretinda.com.",
          ],
        },
        {
          to: "seller",
          subject: `Maretinda turned down the return on ${order}`,
          heading: "The escalated return was turned down",
          paragraphs: [`Maretinda reviewed the return you escalated on ${order} and did not approve it.`, ...noted("Note from Maretinda", f.adminNote)],
        },
      ]
    default:
      return []
  }
}

async function sendReturnEmails(container: any, id: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_return_request",
    fields: [
      "id",
      "status",
      "vendor_reviewer_note",
      "admin_reviewer_note",
      "order.id",
      "order.display_id",
      "order.email",
      "order.customer.first_name",
      "order.customer.email",
      "seller.name",
      "seller.email",
    ],
    filters: { id },
  })
  const r: any = data[0]
  if (!r?.order) return
  const emails = returnEmails({
    status: r.status,
    orderNumber: String(r.order.display_id ?? r.order.id),
    sellerName: r.seller?.name || "The seller",
    sellerNote: r.vendor_reviewer_note,
    adminNote: r.admin_reviewer_note,
  })
  for (const e of emails) {
    const buyer = e.to === "buyer"
    await sendNotice(container, {
      to: buyer ? r.order.email || r.order.customer?.email : r.seller?.email,
      subject: e.subject,
      eyebrow: "Returns",
      heading: e.heading,
      user_name: buyer ? r.order.customer?.first_name : r.seller?.name,
      paragraphs: e.paragraphs,
      button: buyer
        ? { label: "View my returns", url: `${storefrontUrl()}/user/returns` }
        : { label: "Open seller panel", url: `${sellerPanelUrl()}/orders/${r.order.id}` },
    })
  }
}

/**
 * Emails the buyer and seller once a return request is created or decided.
 * Reads the request's id from the route's own answer, so it works for
 * Mercur's routes and ours alike, and never delays or fails the request.
 */
export function emailReturnUpdates(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method !== "POST") return next()
  let id: string | undefined
  const json = res.json.bind(res)
  res.json = ((body: any) => {
    id = body?.order_return_request?.id
    return json(body)
  }) as any
  res.on("finish", () => {
    if (!id || res.statusCode >= 300) return
    sendReturnEmails(req.scope, id).catch((e) => console.error("[return-emails] failed:", e?.message))
  })
  next()
}
