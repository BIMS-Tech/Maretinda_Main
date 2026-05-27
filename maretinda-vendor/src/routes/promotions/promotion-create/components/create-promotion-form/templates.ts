const commonHiddenFields = [
  "type",
  "application_method.type",
  "application_method.allocation",
]

export const templates = [
  {
    id: "percentage_off_order",
    type: "standard",
    title: "% off whole order",
    description: "Discount a percentage off the customer's total order from your shop",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "percentage",
      },
    },
  },
  {
    id: "amount_off_order",
    type: "standard",
    title: "Fixed ₱ off whole order",
    description: "Give a fixed peso discount on the customer's total order",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
      type: "standard",
      application_method: {
        allocation: "across",
        target_type: "order",
        type: "fixed",
      },
    },
  },
  {
    id: "percentage_off_product",
    type: "standard",
    title: "% off selected products",
    description: "Discount a percentage off specific products in your shop",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "percentage",
      },
    },
  },
  {
    id: "amount_off_products",
    type: "standard",
    title: "Fixed ₱ off selected products",
    description: "Give a fixed peso discount on specific products in your shop",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "fixed",
      },
    },
  },
]
