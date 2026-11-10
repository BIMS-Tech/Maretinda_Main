/** Carts of this many pesos (items, before shipping) ship free, as the store promises. */
export const FREE_SHIPPING_MIN_ORDER = 499

export const FREE_SHIPPING_RULE = { attribute: "item_total", operator: "gte", value: FREE_SHIPPING_MIN_ORDER }

type Price = {
  currency_code?: string
  region_id?: string
  amount: number
  rules?: { attribute: string; operator: string; value: number | string }[]
}

const isFreeTier = (p: Price) =>
  p.amount === 0 &&
  (p.rules ?? []).some((r) => r.attribute === "item_total" && r.operator === "gte" && Number(r.value) === FREE_SHIPPING_MIN_ORDER)

/**
 * Adds the ₱0 "free over ₱499" price beside each flat currency price that
 * doesn't have it yet. Medusa picks the conditional price when the cart's
 * item total reaches the threshold.
 */
export function withFreeShippingPrice<T extends Price>(prices: T[]): T[] {
  const currencies = prices
    .filter((p) => p.currency_code && !(p.rules ?? []).length)
    .map((p) => p.currency_code as string)
  const missing = [...new Set(currencies)].filter(
    (code) => !prices.some((p) => p.currency_code === code && isFreeTier(p))
  )
  return [
    ...prices,
    ...missing.map((currency_code) => ({ currency_code, amount: 0, rules: [{ ...FREE_SHIPPING_RULE }] }) as unknown as T),
  ]
}
