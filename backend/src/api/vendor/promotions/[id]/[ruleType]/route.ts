import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

/**
 * GET /vendor/promotions/:id/:ruleType
 * Get the rules of a promotion by rule type.
 * ruleType can be "rules", "target-rules", or "buy-rules".
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const sellerId = await getSellerIdFromMember(req)
    if (!sellerId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { id, ruleType } = req.params

    if (!["rules", "target-rules", "buy-rules"].includes(ruleType)) {
      res.status(400).json({ message: `Invalid rule type: ${ruleType}` })
      return
    }

    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    const promotion = await promotionModule.retrievePromotion(id, {
      relations: [
        "rules",
        "application_method",
        "application_method.target_rules",
        "application_method.buy_rules",
      ],
    } as any)

    if (!promotion) {
      res.status(404).json({ message: "Promotion not found" })
      return
    }

    if ((promotion as any).metadata?.seller_id !== sellerId) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    let rules: any[]

    if (ruleType === "rules") {
      rules = (promotion as any).rules || []
    } else if (ruleType === "target-rules") {
      rules = (promotion as any).application_method?.target_rules || []
    } else {
      // buy-rules
      rules = (promotion as any).application_method?.buy_rules || []
    }

    res.status(200).json({ rules })
  } catch (error: any) {
    console.error("[VendorGetPromotionRules] Error:", error)
    res.status(500).json({ message: "Failed to retrieve promotion rules", error: error.message })
  }
}
