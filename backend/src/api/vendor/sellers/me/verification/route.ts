import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isVerificationComplete, deriveStatusAfterSellerUpdate } from "../../../../../lib/seller-verification"

/**
 * POST /vendor/sellers/me/verification
 *
 * Dedicated endpoint for business-verification details (TIN, organization type,
 * documents). Bypasses the Mercur plugin's strict seller-update validator that
 * rejects unrecognized fields on /vendor/sellers/me.
 *
 * Sellers can never self-verify; completing the required details moves them to
 * "pending_review" for admin confirmation.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }
    if (!pgConnection) {
      res.status(500).json({ message: "Database connection not available" })
      return
    }

    const member = await pgConnection("member").where("id", memberId).first()
    if (!member || !member.seller_id) {
      res.status(404).json({ message: "Seller not found" })
      return
    }
    const sellerId = member.seller_id
    const body = req.body as any

    const update: any = { updated_at: new Date() }
    if (body.tax_id !== undefined) update.tax_id = body.tax_id
    if (body.form_of_organization !== undefined) update.form_of_organization = body.form_of_organization
    if (body.business_documents !== undefined) {
      update.business_documents =
        body.business_documents && typeof body.business_documents === "object"
          ? JSON.stringify(body.business_documents)
          : body.business_documents
    }

    // Recompute verification status from the merged values.
    const current = await pgConnection("seller").where("id", sellerId).first()
    const merged = {
      tax_id: update.tax_id !== undefined ? update.tax_id : current?.tax_id,
      form_of_organization:
        update.form_of_organization !== undefined ? update.form_of_organization : current?.form_of_organization,
      business_documents:
        body.business_documents !== undefined ? body.business_documents : current?.business_documents,
    }
    const complete = isVerificationComplete(merged)
    update.verification_status = deriveStatusAfterSellerUpdate(current?.verification_status, complete)

    const result = await pgConnection("seller").where("id", sellerId).update(update).returning("*")
    const updatedSeller = Array.isArray(result) ? result[0] : result

    res.status(200).json({ seller: updatedSeller })
  } catch (error) {
    console.error("[verification] Error updating verification:", error)
    res.status(500).json({
      message: "Failed to update verification",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
