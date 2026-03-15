import { SingleColumnPage } from "../../components/layout/pages"
import { useDashboardExtension } from "../../extensions"
import { ShippingSetup } from "./components/shipping-setup"
import { ShippingAnalytics } from "./components/shipping-analytics"

export const Shipping = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("shipping.dashboard.after"),
        before: getWidgets("shipping.dashboard.before"),
      }}
    >
      <div className="flex flex-col gap-y-6">
        <ShippingSetup />
        <ShippingAnalytics />
      </div>
    </SingleColumnPage>
  )
}

export default Shipping