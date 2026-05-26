import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Run with: npx medusa exec src/scripts/seed-hellomrtd.ts
 *
 * Creates the HELLOMRTD welcome promotion:
 *   ₱200 fixed discount on first order over ₱1,500
 *   Only usable by customers in the "First Time Buyers" group
 */
export default async function seedHelloMrtd({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const promotionService = container.resolve(Modules.PROMOTION)
  const customerService = container.resolve(Modules.CUSTOMER)

  // Check if already seeded
  const existing = await promotionService.listPromotions({
    code: ["HELLOMRTD"],
  })
  if (existing.length > 0) {
    logger.info("HELLOMRTD promotion already exists — skipping.")
    return
  }

  // Resolve the First Time Buyers customer group
  const groups = await customerService.listCustomerGroups({
    name: "First Time Buyers",
  })

  let groupId: string | null = null
  if (groups.length > 0) {
    groupId = groups[0].id
    logger.info(`Found 'First Time Buyers' group: ${groupId}`)
  } else {
    logger.warn(
      "No 'First Time Buyers' group found — promotion will be created without group restriction. Run the app to auto-create the group on first customer signup."
    )
  }

  const rules: any[] = [
    // Minimum cart subtotal: ₱1,500 (in centavos = 150,000)
    {
      operator: "gte",
      attribute: "subtotal",
      values: ["150000"],
    },
  ]

  if (groupId) {
    rules.push({
      operator: "in",
      attribute: "customer.groups.id",
      values: [groupId],
    })
  }

  const promotion = await promotionService.createPromotions({
    code: "HELLOMRTD",
    type: "standard",
    is_automatic: false,
    status: "active",
    application_method: {
      type: "fixed",
      target_type: "order",
      // ₱200 = 20,000 centavos
      value: 20000,
      currency_code: "php",
      apply_to_quantity: 1,
      max_quantity: 1,
    },
    rules,
  } as any)

  logger.info(`✅ Created HELLOMRTD promotion with ID: ${promotion.id}`)

  if (!groupId) {
    logger.warn(
      "Re-run this script after the first customer signs up to add the group restriction."
    )
  }
}
