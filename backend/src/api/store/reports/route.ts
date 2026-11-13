import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { parseReport } from "../../../lib/listing-reports"
import { sendNotice } from "../../../lib/notify"

/**
 * POST /store/reports — a buyer reports a product or a shop. The target is
 * looked up by id or handle, so a report can't be filed against nothing.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const input = parseReport(req.body)
  if (typeof input === "string") return res.status(400).json({ message: input })

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  let row: { id: string; label: string; handle: string | null; seller_id: string | null } | undefined

  if (input.kind === "product") {
    row = await pg("product as p")
      .leftJoin("seller_seller_product_product as sp", function (this: any) {
        this.on("sp.product_id", "p.id").andOnNull("sp.deleted_at")
      })
      .where(function (this: any) {
        this.where("p.id", input.target).orWhere("p.handle", input.target)
      })
      .whereNull("p.deleted_at")
      .first("p.id", "p.title as label", "p.handle", "sp.seller_id")
  } else {
    row = await pg("seller as s")
      .where(function (this: any) {
        this.where("s.id", input.target).orWhere("s.handle", input.target)
      })
      .whereNull("s.deleted_at")
      .first("s.id", "s.name as label", "s.handle", "s.id as seller_id")
  }
  if (!row) return res.status(404).json({ message: "That listing is no longer available" })

  await pg("listing_report").insert({
    kind: input.kind,
    target_id: row.id,
    target_label: row.label,
    target_handle: row.handle,
    seller_id: row.seller_id,
    reason: input.reason,
    comment: input.comment,
    reporter_email: input.email,
  })

  await sendNotice(req.scope, {
    to: process.env.REPORTS_EMAIL || "support@maretinda.com",
    subject: `New report: ${row.label}`,
    eyebrow: "Listing report",
    heading: `A ${input.kind === "product" ? "product" : "shop"} was reported`,
    paragraphs: [
      `${input.kind === "product" ? "Product" : "Shop"}: ${row.label}`,
      `Reason: ${input.reason}`,
      input.comment,
      input.email ? `Reported by ${input.email}` : "The reporter left no email.",
    ],
    note: "Review it in the admin panel under Listing Reports.",
  })

  res.json({ reported: true })
}
