import { model } from "@medusajs/framework/utils"

const SubscriptionPlan = model.define("subscription_plan", {
  id: model.id({ prefix: "subplan" }).primaryKey(),
  name: model.text(),
  price: model.number(),
  features: model.json().nullable(),
  status: model.enum(["active", "inactive"]).default("active"),
  created_at: model.dateTime().default(new Date()),
  updated_at: model.dateTime().default(new Date()),
})

export default SubscriptionPlan
