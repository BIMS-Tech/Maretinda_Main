import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/seller-applications/:id/email-verified
 *
 * The team confirms the applicant's email another way (a call, a reply from
 * that address) when the link never arrived. Approval needs a confirmed email.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const app = await pg("seller_application").where("id", req.params.id).first("id", "email_verified_at")
  if (!app) return res.status(404).json({ message: "Application not found" })
  if (!app.email_verified_at) {
    const by = (req as any).auth_context?.actor_id ?? "admin"
    await pg("seller_application").where("id", app.id).update({ email_verified_at: new Date(), email_verified_by: `admin:${by}` })
  }
  const application = await pg("seller_application").where("id", app.id).first()
  res.json({ application })
}
