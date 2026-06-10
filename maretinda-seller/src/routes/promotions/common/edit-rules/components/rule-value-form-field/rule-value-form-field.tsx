import { RuleAttributeOptionsResponse, StoreDTO } from "@medusajs/types"
import { Input } from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { Form } from "../../../../../../components/common/form"
import { Combobox } from "../../../../../../components/inputs/combobox"
import { usePromotionRuleValues } from "../../../../../../hooks/api/promotions"
import { useStore } from "../../../../../../hooks/api/store"

type RuleValueFormFieldType = {
  form: any
  identifier: string
  scope:
    | "application_method.buy_rules"
    | "rules"
    | "application_method.target_rules"
  name: string
  operator: string
  fieldRule: any
  attributes: RuleAttributeOptionsResponse[]
  ruleType: "rules" | "target-rules" | "buy-rules"
}

const buildFilters = (attribute?: string, store?: StoreDTO) => {
  if (!attribute || !store) {
    return {}
  }

  if (attribute === "currency_code") {
    return {
      value: store.supported_currencies?.map((c) => c.currency_code),
    }
  }

  return {}
}

export const RuleValueFormField = ({
  form,
  identifier,
  scope,
  name,
  operator,
  fieldRule,
  attributes,
  ruleType,
}: RuleValueFormFieldType) => {
  const attribute = attributes?.find(
    (attr) => attr.value === fieldRule.attribute
  )

  const { store, isLoading: isStoreLoading } = useStore()
  const { values: options = [] } = usePromotionRuleValues(
    ruleType,
    attribute?.id!,
    buildFilters(attribute?.id, store),
    {
      enabled:
        !!attribute?.id &&
        ["select", "multiselect"].includes(attribute.field_type) &&
        !isStoreLoading,
    }
  )

  const watchOperator = useWatch({
    control: form.control,
    name: operator,
  })

  return (
    <Form.Field
      key={`${identifier}.${scope}.${name}-${fieldRule.attribute}`}
      name={name}
      render={({ field: { onChange, ref, ...field } }) => {
        if (attribute?.field_type === "number") {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Input
                  {...field}
                  type="number"
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  ref={ref}
                  min={1}
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        } else if (attribute?.field_type === "text") {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Input
                  {...field}
                  ref={ref}
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        } else {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Combobox
                  {...field}
                  ref={ref}
                  placeholder={
                    watchOperator === "eq" ? "Select Value" : "Select Values"
                  }
                  options={options}
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  disabled={!watchOperator}
                />
              </Form.Control>

              <Form.ErrorMessage />
            </Form.Item>
          )
        }
      }}
    />
  )
}
