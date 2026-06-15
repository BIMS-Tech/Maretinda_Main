import { Tabs } from "@medusajs/ui"
import { TruckFast, CogSixTooth, ChartPie, Map } from "@medusajs/icons"
import { useState } from "react"
import { SingleColumnPage } from "../../components/layout/pages"
import { ShippingOrders } from "./components/shipping-orders"
import { ShippingSetup } from "./components/shipping-setup"
import { ShippingAnalytics } from "./components/shipping-analytics"
import { ShippingGuide } from "./components/shipping-guide"

export const Shipping = () => {
  const [activeTab, setActiveTab] = useState("shipments")

  return (
    <SingleColumnPage widgets={{ before: [], after: [] }}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="shipments">
            <TruckFast className="h-4 w-4 mr-1.5" />
            Shipments
          </Tabs.Trigger>
          <Tabs.Trigger value="carriers">
            <CogSixTooth className="h-4 w-4 mr-1.5" />
            Carriers
          </Tabs.Trigger>
          <Tabs.Trigger value="analytics">
            <ChartPie className="h-4 w-4 mr-1.5" />
            Analytics
          </Tabs.Trigger>
          <Tabs.Trigger value="guide">
            <Map className="h-4 w-4 mr-1.5" />
            Setup Guide
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="shipments" className="mt-6">
          <ShippingOrders />
        </Tabs.Content>

        <Tabs.Content value="carriers" className="mt-6">
          <ShippingSetup />
        </Tabs.Content>

        <Tabs.Content value="analytics" className="mt-6">
          <ShippingAnalytics />
        </Tabs.Content>

        <Tabs.Content value="guide" className="mt-6">
          <ShippingGuide />
        </Tabs.Content>
      </Tabs>
    </SingleColumnPage>
  )
}

export default Shipping
