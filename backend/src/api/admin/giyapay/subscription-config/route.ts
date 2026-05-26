import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { z } from "zod"
import crypto from "crypto"

const ConfigSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID is required"),
  merchantSecret: z.string().min(1, "Merchant Secret is required"),
  sandboxMode: z.boolean().optional().default(false),
  isEnabled: z.boolean().optional().default(true),
})

function getDb(req: any) {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const db = getDb(req)
    const row = await db("giyapay_subscription_config").first()
    if (row) {
      res.status(200).json({ config: { ...row, merchant_secret: "***" } })
    } else {
      res.status(200).json({ config: null })
    }
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch config" })
  }
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const validated = ConfigSchema.parse(req.body)
    const db = getDb(req)

    const existing = await db("giyapay_subscription_config").first()
    let row: any

    if (existing) {
      const [updated] = await db("giyapay_subscription_config")
        .where("id", existing.id)
        .update({
          merchant_id: validated.merchantId,
          merchant_secret: validated.merchantSecret,
          sandbox_mode: validated.sandboxMode,
          is_enabled: validated.isEnabled,
          updated_at: new Date(),
        })
        .returning("*")
      row = updated
    } else {
      const [inserted] = await db("giyapay_subscription_config")
        .insert({
          id: `giyapay_sub_${crypto.randomBytes(6).toString("hex")}`,
          merchant_id: validated.merchantId,
          merchant_secret: validated.merchantSecret,
          sandbox_mode: validated.sandboxMode,
          is_enabled: validated.isEnabled,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*")
      row = inserted
    }

    res.status(200).json({
      message: "Subscription payment config saved",
      config: { ...row, merchant_secret: "***" },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation failed", details: error.errors })
      return
    }
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to save config" })
  }
}
