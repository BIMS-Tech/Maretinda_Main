import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"
import { withFreeShippingPrice } from "../lib/free-shipping"

/**
 * Gives every existing flat-rate delivery option the ₱0 price for carts of
 * ₱499 or more. New and repriced options get it from the vendor middleware.
 * Return options and courier-quoted (calculated) options are skipped. Safe to
 * run again: options that already have the tier are left as they are.
 *
 *   npx medusa exec ./src/scripts/apply-free-shipping.ts
 */
export default async function applyFreeShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "price_type", "rules.attribute", "rules.value", "prices.id", "prices.currency_code", "prices.amount", "prices.price_rules.attribute", "prices.price_rules.operator", "prices.price_rules.value"],
  })

  let updated = 0
  for (const option of options as any[]) {
    if (option.price_type !== "flat") continue
    const isReturn = (option.rules ?? []).some((r: any) => r.attribute === "is_return" && String(r.value) === "true")
    if (isReturn) continue

    const existing = (option.prices ?? []).map((p: any) => ({
      id: p.id,
      currency_code: p.currency_code,
      amount: Number(p.amount),
      rules: (p.price_rules ?? []).map((r: any) => ({ attribute: r.attribute, operator: r.operator, value: Number(r.value) })),
    }))
    const next = withFreeShippingPrice(existing)
    if (next.length === existing.length) continue

    await updateShippingOptionsWorkflow(container).run({
      input: [{ id: option.id, prices: next.map(({ id, currency_code, amount, rules }: any) => (id ? { id, amount, rules } : { currency_code, amount, rules })) }],
    })
    updated++
    logger.info(`Free shipping over ₱499 added to "${option.name}" (${option.id})`)
  }
  logger.info(`Done: ${updated} delivery option(s) updated`)
}
