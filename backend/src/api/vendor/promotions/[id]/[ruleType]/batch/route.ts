import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, RuleType } from "@medusajs/framework/utils"
import { batchPromotionRulesWorkflow } from "@medusajs/core-flows"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

async function sellerOwnsPromotion(pg: any, sellerId: string, promotionId: string): Promise<boolean> {
  const result = await pg.raw(
    `SELECT 1 FROM seller_seller_promotion_promotion WHERE deleted_at IS NULL AND seller_id = ? AND promotion_id = ? LIMIT 1`,
    [sellerId, promotionId]
  )
  return result.rows.length > 0
}

function toRuleType(ruleType: string): RuleType {
  if (ruleType === "rules") return RuleType.RULES
  if (ruleType === "target-rules") return RuleType.TARGET_RULES
  if (ruleType === "buy-rules") return RuleType.BUY_RULES
  throw new Error(`Invalid rule type: ${ruleType}`)
}

/**
 * POST /vendor/promotions/:id/:ruleType/batch
 * Batch add/update/remove rules on a promotion.
 * Body: { create: [], update: [], delete: [] }
 */
export async function POST(
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

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    if (!await sellerOwnsPromotion(pg, sellerId, id)) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    const body = req.body as any

    const { result } = await batchPromotionRulesWorkflow(req.scope).run({
      input: {
        id,
        rule_type: toRuleType(ruleType),
        create: body.create || [],
        update: body.update || [],
        delete: body.delete || [],
      },
    })

    const updatedPromotion = await promotionModule.retrievePromotion(id, {
      relations: [
        "rules",
        "application_method",
        "application_method.target_rules",
        "application_method.buy_rules",
      ],
    } as any)

    res.status(200).json({ promotion: updatedPromotion, result })
  } catch (error: any) {
    console.error("[VendorBatchPromotionRules] Error:", error)
    res.status(500).json({ message: "Failed to batch update promotion rules", error: error.message })
  }
}
