import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { savePromotionMetadata } from "../lib/promotion-metadata"

/**
 * The welcome voucher the hero and newsletter advertise: ₱200 off a first
 * order over ₱1,500. Amounts are pesos, like every Medusa amount here.
 * First-order-only is enforced by the promo-code guards in api/middlewares.ts.
 */
export const HELLOMRTD = {
  promotion: {
    code: "HELLOMRTD",
    type: "standard",
    is_automatic: false,
    status: "active",
    application_method: {
      type: "fixed",
      target_type: "order",
      allocation: "across",
      value: 200,
      currency_code: "php",
    },
    rules: [{ attribute: "subtotal", operator: "gte", values: ["1500"] }],
  },
  metadata: {
    first_order_only: true,
    description: "₱200 off your first order over ₱1,500",
  },
}

/** Run with: npx medusa exec src/scripts/seed-hellomrtd.ts (safe to re-run) */
export default async function seedHelloMrtd({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const promotionService = container.resolve(Modules.PROMOTION)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const [existing] = await promotionService.listPromotions({ code: [HELLOMRTD.promotion.code] })
  const promotion = existing ?? (await promotionService.createPromotions(HELLOMRTD.promotion as any))

  await savePromotionMetadata(pg, promotion.id, HELLOMRTD.metadata)
  logger.info(`${existing ? "Kept" : "Created"} HELLOMRTD (${promotion.id}) and set it to first orders only`)
}
