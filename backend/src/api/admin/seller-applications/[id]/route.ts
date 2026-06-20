import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSellerWorkflow } from "@mercurjs/b2c-core/workflows"

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

    const app = await db("seller_application").where("id", id).first()
    if (!app) {
      res.status(404).json({ message: "Application not found" })
      return
    }

    // On approval, create + activate the seller account from the auth identity
    // that was created at registration. This mirrors Mercur's
    // seller-creation-request-accepted subscriber.
    let createdSellerId: string | undefined = seller_id ?? undefined
    if (status === "approved" && !app.seller_id) {
      if (!app.auth_identity_id) {
        res.status(422).json({
          message:
            "This application has no linked auth identity, so the seller account cannot be created automatically. The applicant should re-register.",
        })
        return
      }
      const fullName = `${app.first_name ?? ""} ${app.last_name ?? ""}`.trim()
      const { result: seller } = await createSellerWorkflow.run({
        container: req.scope,
        input: {
          auth_identity_id: app.auth_identity_id,
          seller: {
            name: app.business_name || fullName || app.email,
            email: app.email,
          } as any,
          member: {
            name: fullName || app.business_name || app.email,
            email: app.email,
          } as any,
        },
      })
      createdSellerId = (seller as any)?.id
    }

    const [updated] = await db("seller_application")
      .where("id", id)
      .update({
        status,
        admin_notes: admin_notes ?? undefined,
        seller_id: createdSellerId ?? undefined,
        reviewed_at: new Date(),
      })
      .returning("*")

    res.status(200).json({ application: updated })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update application" })
  }
}
