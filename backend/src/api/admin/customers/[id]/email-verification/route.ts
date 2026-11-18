import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { customerEmailState, markCustomerVerified } from "../../../../../lib/email-verification"

/** GET /admin/customers/:id/email-verification — is the buyer's email confirmed? */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const state = await customerEmailState(pg, req.params.id)
  if (!state.exists) return res.status(404).json({ message: "Customer not found" })
  const row = await pg("customer_email_verified").where("customer_id", req.params.id).first("method", "verified_at")
  res.json({ email: state.email, verified: state.verified, method: state.verified ? row?.method ?? null : null, verified_at: state.verified ? row?.verified_at ?? null : null })
}

/**
 * POST /admin/customers/:id/email-verification — support confirms the buyer's
 * email another way (they replied from it, or called in), for when the link
 * never arrives. Needs the Support area (admin roles).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const by = (req as any).auth_context?.actor_id ?? null
  const ok = await markCustomerVerified(pg, req.params.id, "admin", by)
  if (!ok) return res.status(404).json({ message: "Customer not found" })
  res.json({ verified: true })
}
