import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"

interface RuleOperator {
  label: string
  value: string
}

interface RuleAttributeOption {
  id: string
  value: string
  label: string
  field_type: string
  operators: RuleOperator[]
  disguised: boolean
  required?: boolean
}

const RULES_ATTRIBUTES: RuleAttributeOption[] = [
  {
    id: "customer_group",
    value: "customer.groups.id",
    label: "Customer Group",
    field_type: "multiselect",
    operators: [
      { label: "In", value: "in" },
      { label: "Not In", value: "nin" },
    ],
    disguised: false,
    required: false,
  },
  {
    id: "currency_code",
    value: "currency_code",
    label: "Currency",
    field_type: "select",
    operators: [{ label: "Equals", value: "eq" }],
    disguised: false,
    required: false,
  },
  {
    id: "country",
    value: "shipping_address.country_code",
    label: "Country",
    field_type: "multiselect",
    operators: [
      { label: "In", value: "in" },
      { label: "Not In", value: "nin" },
    ],
    disguised: false,
    required: false,
  },
]

const LINE_ITEM_ATTRIBUTES: RuleAttributeOption[] = [
  {
    id: "product",
    value: "items.product.id",
    label: "Product",
    field_type: "multiselect",
    operators: [
      { label: "In", value: "in" },
      { label: "Not In", value: "nin" },
    ],
    disguised: false,
    required: false,
  },
  {
    id: "product_category",
    value: "items.product.category_id",
    label: "Product Category",
    field_type: "multiselect",
    operators: [
      { label: "In", value: "in" },
      { label: "Not In", value: "nin" },
    ],
    disguised: false,
    required: false,
  },
]

/**
 * GET /seller/promotions/rule-attribute-options/:ruleType
 * Return static rule attribute options for the given rule type.
 * ruleType can be: "rules", "target-rules", or "buy-rules".
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { ruleType } = req.params

  let attributes: RuleAttributeOption[]

  if (ruleType === "rules") {
    attributes = RULES_ATTRIBUTES
  } else if (ruleType === "target-rules" || ruleType === "buy-rules") {
    attributes = LINE_ITEM_ATTRIBUTES
  } else {
    res.status(400).json({ message: `Invalid rule type: ${ruleType}` })
    return
  }

  res.status(200).json({ attributes })
}
