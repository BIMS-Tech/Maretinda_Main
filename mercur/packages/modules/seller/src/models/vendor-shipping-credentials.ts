import { model } from "@medusajs/framework/utils"
import { Seller } from "./seller"

export const VendorShippingCredentials = model.define("vendor_shipping_credentials", {
  id: model.id({ prefix: "vsc" }).primaryKey(),
  vendor_id: model.text(),
  provider_id: model.text(),
  credentials: model.json(), // Encrypted credentials object
  is_active: model.boolean().default(true),
  last_used: model.dateTime().nullable(),
  metadata: model.json().default({}),
  
  // Relationships
  seller: model.belongsTo(() => Seller, {
    foreignKey: "vendor_id",
    mappedBy: "shippingCredentials"
  })
})

export default VendorShippingCredentials


