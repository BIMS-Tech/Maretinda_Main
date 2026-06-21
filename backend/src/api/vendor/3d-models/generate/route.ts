import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomBytes } from "crypto"

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`
}

async function getSellerIdFromMember(req: MedusaRequest): Promise<string | null> {
  const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

/**
 * POST /vendor/3d-models/generate
 *
 * Starts a 3D model generation task from a product image using Meshy.ai.
 * Restricted to Boost and Managed subscription tiers.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const member = await pg("member").where("id", memberId).first()
    if (!member?.seller_id) {
      res.status(403).json({ message: "Not a seller" })
      return
    }
    const sellerId = member.seller_id

    // Verify subscription is Boost or Managed (tiers 2 and 3).
    // end_date guard: an expired-but-not-yet-swept subscription must not grant access.
    const subscription = await pg("seller_subscription")
      .where("seller_id", sellerId)
      .where("status", "active")
      .where("end_date", ">", new Date())
      .first()

    if (!subscription) {
      res.status(403).json({
        message: "An active subscription is required to use 3D model generation.",
        error_code: "NO_SUBSCRIPTION",
      })
      return
    }

    const allowedPlans = ["Boost", "Managed"]
    if (!allowedPlans.includes(subscription.plan_name)) {
      res.status(403).json({
        message: "3D model generation is available on Boost and Managed plans.",
        error_code: "PLAN_NOT_ELIGIBLE",
        current_plan: subscription.plan_name,
        required_plans: allowedPlans,
      })
      return
    }

    const { product_id, image_url } = req.body as { product_id: string; image_url: string }
    if (!product_id || !image_url) {
      res.status(400).json({ message: "product_id and image_url are required" })
      return
    }

    // Validate the product belongs to this seller via mercurjs link table
    const productRow = await pg.raw(
      `SELECT p.id FROM product p
       JOIN seller_seller_product_product spp ON spp.product_id = p.id
       WHERE spp.seller_id = ? AND p.id = ? AND p.deleted_at IS NULL
       LIMIT 1`,
      [sellerId, product_id]
    )
    if (!productRow.rows?.length) {
      res.status(404).json({ message: "Product not found or not owned by your account" })
      return
    }

    const meshyApiKey = process.env.MESHY_API_KEY
    if (!meshyApiKey) {
      res.status(503).json({ message: "3D generation service is not configured. Please contact support." })
      return
    }

    // Initiate Meshy.ai image-to-3D task
    const meshyRes = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${meshyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url,
        enable_pbr: true,
        ai_model: "meshy-4",
      }),
    })

    if (!meshyRes.ok) {
      const errText = await meshyRes.text()
      console.error("[3D Generate] Meshy API error:", errText)
      res.status(502).json({ message: "3D generation service returned an error. Please try again." })
      return
    }

    const meshyData = (await meshyRes.json()) as { result: string }
    const providerTaskId = meshyData.result

    const modelId = generateId("3dm")
    await pg("product_3d_model").insert({
      id: modelId,
      product_id,
      seller_id: sellerId,
      status: "processing",
      source_image_url: image_url,
      provider: "meshy",
      provider_task_id: providerTaskId,
      progress: 0,
      is_primary: false,
      created_at: new Date(),
      updated_at: new Date(),
    })

    res.status(201).json({
      model: {
        id: modelId,
        product_id,
        status: "processing",
        provider_task_id: providerTaskId,
        source_image_url: image_url,
        progress: 0,
      },
    })
  } catch (error) {
    console.error("[3D Generate] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to start 3D generation" })
  }
}
