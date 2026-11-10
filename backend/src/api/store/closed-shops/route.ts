import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { closedShopHandles } from "../../../lib/seller-plan"

/**
 * GET /store/closed-shops
 *
 * Shops whose plan has ended. Their products stay in the search index, so the
 * storefront filters these handles out of listings and search.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ handles: await closedShopHandles(pg) })
}
