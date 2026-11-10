import { Outlet } from "react-router-dom"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useDashboardExtension } from "../../../extensions"
import { FlashSaleListTable } from "./components/flash-sale-list-table"
import { FeatureGate } from "../../../components/common/feature-gate"

export const FlashSaleList = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    // The outlet sits inside the plan gate below, so the page doesn't add its own
    <SingleColumnPage
      hasOutlet={false}
      widgets={{
        before: getWidgets("flash_sale.list.before"),
        after: getWidgets("flash_sale.list.after"),
      }}
    >
      <FeatureGate
        requiredPlans={["Growth", "Premium"]}
        featureName="Flash Sales"
        description="Flash Sales lets you create time-limited discounts to drive traffic and boost conversions."
      >
        <FlashSaleListTable />
        <Outlet />
      </FeatureGate>
    </SingleColumnPage>
  )
}
