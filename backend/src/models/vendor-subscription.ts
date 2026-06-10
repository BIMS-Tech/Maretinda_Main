import { model } from "@medusajs/framework/utils"

const sellersubscription = model.define("seller_subscription", {
  id: model.id({ prefix: "vsub" }).primaryKey(),
  seller_id: model.text(),
  plan_name: model.text(),
  price: model.number(),
  start_date: model.dateTime(),
  end_date: model.dateTime(),
  status: model.enum(["active", "expired", "cancelled"]).default("active"),
  auto_renew: model.boolean().default(false),
  payment_reference: model.text().nullable(),
  created_at: model.dateTime().default(new Date()),
  updated_at: model.dateTime().default(new Date()),
})

export default sellersubscription
