import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { verify } from "jsonwebtoken"

/**
 * GET /store/seller-application/status
 *
 * Where a signed-in applicant's application stands. An applicant has a seller
 * login before they have a shop, and every /vendor route refuses them ("Seller
 * is not active"), so the seller panel asks here what to show instead of
 * bouncing them back to an empty sign-in page.
 *
 * Reads the seller login's token; only ever returns that login's own
 * application.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const header = String(req.headers.authorization || "")
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  let payload: any
  try {
    const { projectConfig } = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any
    payload = verify(token, projectConfig.http.jwtSecret as string)
  } catch {
    return res.status(401).json({ message: "Please sign in again." })
  }
  if (payload?.actor_type !== "seller" || !payload?.auth_identity_id) {
    return res.status(401).json({ message: "Please sign in again." })
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const app = await pg("seller_application")
    .where("auth_identity_id", payload.auth_identity_id)
    .orderBy("submitted_at", "desc")
    .first("status", "email", "shop_name", "business_name", "submitted_at", "reviewed_at", "admin_notes", "seller_id")

  // A shop exists but this sign-in predates it: signing in again opens it
  const hasShop = !!payload.actor_id || !!app?.seller_id
  const status = !app ? (hasShop ? "approved" : "none") : app.status

  res.json({
    status,
    email: app?.email ?? null,
    shop_name: app?.shop_name || app?.business_name || null,
    submitted_at: app?.submitted_at ?? null,
    reviewed_at: app?.reviewed_at ?? null,
    // The team's reason is already in the rejection email; repeat it here
    note: status === "rejected" ? app?.admin_notes || null : null,
  })
}
