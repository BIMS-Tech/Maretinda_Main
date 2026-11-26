import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** POST /admin/seller-charges/:id/waive  { note } — Maretinda absorbs what is still owed (a courier claim paid, goodwill). */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const charge = await pg("seller_charge").where("id", req.params.id).whereNull("waived_at").first("id", "label")
  if (!charge) return res.status(404).json({ message: "Charge not found or already waived" })
  const note = typeof (req.body as any)?.note === "string" ? (req.body as any).note.trim().slice(0, 200) : ""
  if (!note) return res.status(400).json({ message: "Say why it is waived." })
  await pg("seller_charge").where("id", charge.id).update({ waived_at: new Date(), label: `${charge.label} (waived: ${note})` })
  res.json({ waived: true })
}
