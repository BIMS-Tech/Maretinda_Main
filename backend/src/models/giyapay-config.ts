import { model } from "@medusajs/framework/utils"

const GiyaPayConfig = model.define("giyapay_config", {
  id: model.id({ prefix: "giyapay" }).primaryKey(),
  merchantId: model.text(),
  merchantSecret: model.text(),
  sandboxMode: model.boolean().default(true),
  isEnabled: model.boolean().default(false),
  createdAt: model.dateTime().default(new Date()),
  updatedAt: model.dateTime().default(new Date()),
})

export default GiyaPayConfig









