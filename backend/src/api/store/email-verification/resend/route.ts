import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  bearerPayload,
  customerEmailState,
  resendSellerVerification,
  sendCustomerVerification,
} from "../../../../lib/email-verification"

/**
 * POST /store/email-verification/resend
 *
 * Sends a fresh confirmation link to the signed-in buyer, or to a signed-in
 * seller applicant whose application is waiting. Rate limited in middlewares.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const payload = bearerPayload(req)
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  if (payload?.actor_type === "customer" && payload.actor_id) {
    const state = await customerEmailState(pg, payload.actor_id)
    if (!state.exists) return res.status(401).json({ message: "Please sign in again." })
    if (state.verified) return res.json({ verified: true, sent: false, email: state.email })
    const sent = await sendCustomerVerification(req.scope, payload.actor_id, { welcome: false })
    return res.json({ verified: false, sent, email: state.email })
  }

  if (payload?.actor_type === "seller" && payload.auth_identity_id) {
    const app = await pg("seller_application")
      .where("auth_identity_id", payload.auth_identity_id)
      .orderBy("submitted_at", "desc")
      .first("id", "email", "first_name", "last_name", "shop_name", "status", "email_verified_at")
    if (!app) return res.status(404).json({ message: "We couldn't find your application." })
    if (app.email_verified_at || app.status !== "pending") return res.json({ verified: true, sent: false, email: app.email })
    const sent = await resendSellerVerification(req.scope, app)
    return res.json({ verified: false, sent, email: app.email })
  }

  res.status(401).json({ message: "Please sign in again." })
}
