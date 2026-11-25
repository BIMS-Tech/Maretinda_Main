import { Tabs } from "@medusajs/ui"
import { ChartPie, CogSixTooth, Map, TruckFast } from "@medusajs/icons"
import { useSearchParams } from "react-router-dom"
import { SingleColumnPage } from "../../components/layout/pages"
import { DeliverySetupTab } from "./components/delivery-setup"
import { ShippingOrders } from "./components/shipping-orders"
import { ShippingSetup } from "./components/shipping-setup"
import { ShippingAnalytics } from "./components/shipping-analytics"
import { ShippingGuide } from "./components/shipping-guide"

const TABS = ["shipments", "setup", "guide", "carriers", "analytics"] as const

export const Shipping = () => {
  // The tab is in the address, so links elsewhere (setup checklist, locations) open the right one
  const [params, setParams] = useSearchParams()
  const asked = params.get("tab")
  const activeTab = TABS.find((t) => t === asked) ?? "shipments"

  return (
    <SingleColumnPage widgets={{ before: [], after: [] }}>
      <Tabs value={activeTab} onValueChange={(tab) => setParams({ tab }, { replace: true })}>
        <Tabs.List className="flex-wrap">
          <Tabs.Trigger value="shipments">
            <TruckFast className="h-4 w-4 mr-1.5" />
            Shipments
          </Tabs.Trigger>
          <Tabs.Trigger value="setup">
            <CogSixTooth className="h-4 w-4 mr-1.5" />
            Set up delivery
          </Tabs.Trigger>
          <Tabs.Trigger value="guide">
            <Map className="h-4 w-4 mr-1.5" />
            How to ship
          </Tabs.Trigger>
          <Tabs.Trigger value="carriers">
            <TruckFast className="h-4 w-4 mr-1.5" />
            Couriers
          </Tabs.Trigger>
          <Tabs.Trigger value="analytics">
            <ChartPie className="h-4 w-4 mr-1.5" />
            Analytics
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="shipments" className="mt-6">
          <ShippingOrders />
        </Tabs.Content>

        <Tabs.Content value="setup" className="mt-6">
          <DeliverySetupTab />
        </Tabs.Content>

        <Tabs.Content value="guide" className="mt-6">
          <ShippingGuide />
        </Tabs.Content>

        <Tabs.Content value="carriers" className="mt-6">
          <ShippingSetup />
        </Tabs.Content>

        <Tabs.Content value="analytics" className="mt-6">
          <ShippingAnalytics />
        </Tabs.Content>
      </Tabs>
    </SingleColumnPage>
  )
}

export default Shipping
