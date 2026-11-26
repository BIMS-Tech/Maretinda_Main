import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerIdOfMember } from "../../../lib/seller-ownership"
import { STAGE_LABELS } from "../../../lib/return-cases"

/** GET /vendor/return-cases — the shop's returns with their stage and deadline, newest first. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })
  const rows = await pg("return_case").where("seller_id", sellerId).orderBy("created_at", "desc").limit(200)
    .select("request_id", "order_id", "stage", "respond_by", "ship_back_by", "inspect_by", "created_at")
  res.json({ return_cases: rows.map((r: any) => ({ ...r, stage_label: STAGE_LABELS[r.stage as keyof typeof STAGE_LABELS] })) })
}
