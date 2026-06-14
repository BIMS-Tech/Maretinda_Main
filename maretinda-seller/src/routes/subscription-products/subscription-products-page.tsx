import { SingleColumnPage } from "../../components/layout/pages"
import { FeatureGate } from "../../components/common/feature-gate"

const SubscriptionProductsPage = () => {
  return (
    <SingleColumnPage widgets={{ before: [], after: [] }}>
      <FeatureGate
        requiredPlans={["Growth", "Premium"]}
        featureName="Subscription Products"
        description="Subscription Products lets you sell on a recurring basis — customers subscribe and get auto-charged weekly or monthly."
        comingSoon
      />
    </SingleColumnPage>
  )
}

export const Component = SubscriptionProductsPage
