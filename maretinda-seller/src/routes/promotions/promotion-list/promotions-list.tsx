import { SingleColumnPage } from "../../../components/layout/pages"
import { useDashboardExtension } from "../../../extensions"
import { PromotionListTable } from "./components/promotion-list-table"
import { FeatureGate } from "../../../components/common/feature-gate"

export const PromotionsList = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    // The table renders the outlet inside the plan gate, so the page doesn't add its own
    <SingleColumnPage
      hasOutlet={false}
      widgets={{
        before: getWidgets("promotion.list.before"),
        after: getWidgets("promotion.list.after"),
      }}
    >
      <FeatureGate
        requiredPlans={["Growth", "Premium"]}
        featureName="Promotions & Vouchers"
        description="Promotions & Vouchers lets you create discount codes and campaigns to reward customers."
      >
        <PromotionListTable />
      </FeatureGate>
    </SingleColumnPage>
  )
}
