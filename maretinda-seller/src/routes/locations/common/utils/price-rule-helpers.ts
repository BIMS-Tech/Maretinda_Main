import { castNumber } from "../../../../lib/cast-number"
import { ITEM_TOTAL_ATTRIBUTE } from "../constants"

const createPriceRule = (
  attribute: string,
  operator: string,
  value: string | number
) => {
  const rule = {
    attribute,
    operator,
    value: castNumber(value),
  }

  return rule
}

export const buildShippingOptionPriceRules = (rule: {
  gte?: string | number | null
  lte?: string | number | null
  gt?: string | number | null
  lt?: string | number | null
  eq?: string | number | null
}) => {
  const conditions = [
    { value: rule.gte, operator: "gte" },
    { value: rule.lte, operator: "lte" },
    { value: rule.gt, operator: "gt" },
    { value: rule.lt, operator: "lt" },
    { value: rule.eq, operator: "eq" },
  ]

  const conditionsWithValues = conditions.filter(({ value }) => value) as {
    value: string | number
    operator: string
  }[]

  return conditionsWithValues.map(({ operator, value }) =>
    createPriceRule(ITEM_TOTAL_ATTRIBUTE, operator, value)
  )
}

/**
 * Turns the create form's per-currency and per-region inputs into the prices
 * the vendor API takes. Each price carries an empty `rules` list because
 * Mercur 1.5 requires one, even for a flat price.
 */
export const buildShippingOptionPrices = (
  currencyPrices: Record<string, string | number | undefined>,
  regionPrices: Record<string, string | number | undefined>
) => [
  ...Object.entries(currencyPrices)
    .filter(([, value]) => value)
    .map(([currency_code, value]) => ({
      currency_code,
      amount: castNumber(value!),
      rules: [],
    })),
  ...Object.entries(regionPrices)
    .filter(([, value]) => value)
    .map(([region_id, value]) => ({
      region_id,
      amount: castNumber(value!),
      rules: [],
    })),
]

/** Gives flat prices the empty `rules` list Mercur 1.5 requires, keeping conditional ones as they are. */
export const ensurePriceRules = <T extends object>(prices: T[]): T[] =>
  prices.map((price) => ({ rules: [], ...price }))
