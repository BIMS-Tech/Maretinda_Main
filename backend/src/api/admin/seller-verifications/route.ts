import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getDb(req: any) {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__
  }
}

const SELLER_FIELDS = [
  "id",
  "name",
  "handle",
  "email",
  "phone",
  "tax_id",
  "form_of_organization",
  "business_documents",
  "verification_status",
  "verified_at",
  "verification_notes",
  "created_at",
]

/**
 * GET /admin/seller-verifications
 * Lists sellers by verification status (defaults to those awaiting review).
 * Query: ?status=pending_review|verified|rejected|unverified|all
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const status = ((req.query.status as string) || "pending_review").trim()

    let q = db("seller").select(SELLER_FIELDS).orderBy("created_at", "desc")
    if (status && status !== "all") {
      q = q.where("verification_status", status)
    }

    const sellers = await q
    const [{ count }] = await db("seller")
      .where("verification_status", "pending_review")
      .count("id as count")

    res.status(200).json({ sellers, pending_count: Number(count) || 0 })
  } catch (error) {
    console.error("[SellerVerification] GET error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to list verifications" })
  }
}
