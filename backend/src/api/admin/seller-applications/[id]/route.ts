import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function getDb(req: any) {
  return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const { id } = req.params
    const app = await db("seller_application").where("id", id).first()
    if (!app) {
      res.status(404).json({ message: "Application not found" })
      return
    }
    res.status(200).json({ application: app })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch application" })
  }
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const { id } = req.params
    const { status, admin_notes, seller_id } = req.body as any

    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400).json({ message: "status must be pending, approved, or rejected" })
      return
    }

    const [updated] = await db("seller_application")
      .where("id", id)
      .update({
        status,
        admin_notes: admin_notes ?? undefined,
        seller_id: seller_id ?? undefined,
        reviewed_at: new Date(),
      })
      .returning("*")

    if (!updated) {
      res.status(404).json({ message: "Application not found" })
      return
    }

    res.status(200).json({ application: updated })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update application" })
  }
}
