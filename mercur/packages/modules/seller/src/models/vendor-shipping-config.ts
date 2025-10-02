import { model } from "@medusajs/framework/utils"
import { Seller } from "./seller"

export const VendorShippingConfig = model.define("vendor_shipping_config", {
  id: model.id({ prefix: "vsc_cfg" }).primaryKey(),
  vendor_id: model.text().unique(),
  enabled_providers: model.json().default({}), // Array of enabled provider IDs
  default_provider: model.text().nullable(),
  preferences: model.json().default({}), // Auto-select, thresholds, etc.
  billing_config: model.json().default({}), // Payment method, markup, fees
  
  // Relationships
  seller: model.belongsTo(() => Seller, {
    foreignKey: "vendor_id",
    mappedBy: "shippingConfig"
  })
})

export default VendorShippingConfig


