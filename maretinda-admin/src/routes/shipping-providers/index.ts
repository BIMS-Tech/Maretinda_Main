import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Truck } from "@medusajs/icons"
import ShippingProvidersPage from "./shipping-providers"

export const config = defineRouteConfig({
  label: "Shipping Carriers",
  icon: Truck,
})

export default ShippingProvidersPage
