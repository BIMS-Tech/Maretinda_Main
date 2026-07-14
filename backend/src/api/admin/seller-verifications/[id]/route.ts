import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getDb(req: any) {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__
  }
}

/**
 * GET /admin/seller-verifications/:id
 * Full seller record for the verification review screen.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const { id } = req.params
    const seller = await db("seller").where("id", id).first()
    if (!seller) {
      res.status(404).json({ message: "Seller not found" })
      return
    }
    res.status(200).json({ seller })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch seller" })
  }
}

/**
 * PATCH /admin/seller-verifications/:id
 * Approve / reject a seller's business verification.
 * Body: { status: "verified" | "rejected" | "pending_review", notes?: string }
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const { id } = req.params
    const { status, notes } = req.body as { status?: string; notes?: string }

    if (!["verified", "rejected", "pending_review"].includes(status || "")) {
      res.status(400).json({ message: "status must be verified, rejected, or pending_review" })
      return
    }

    const seller = await db("seller").where("id", id).first()
    if (!seller) {
      res.status(404).json({ message: "Seller not found" })
      return
    }

    const update: Record<string, unknown> = {
      verification_status: status,
      verification_notes: notes ?? null,
      verified_at: status === "verified" ? new Date() : null,
      updated_at: new Date(),
    }

    const [updated] = await db("seller").where("id", id).update(update).returning("*")
    res.status(200).json({ seller: updated })
  } catch (error) {
    console.error("[SellerVerification] PATCH error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update verification" })
  }
}
