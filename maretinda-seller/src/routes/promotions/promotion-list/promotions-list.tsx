import { SingleColumnPage } from "../../../components/layout/pages"
import { useDashboardExtension } from "../../../extensions"
import { PromotionListTable } from "./components/promotion-list-table"
import { FeatureGate } from "../../../components/common/feature-gate"

export const PromotionsList = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
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
