import { SingleColumnPage } from "../../components/layout/pages"
import { useDashboardExtension } from "../../extensions"
import { PayoutsList } from "./components/payouts-list"
import { GiyaPayAnalytics } from "./components/giyapay-analytics"
import { SettlementTimeline } from "./components/settlement-timeline"

export const Payouts = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("payouts.list.after"),
        before: getWidgets("payouts.list.before"),
      }}
    >
      <div className="flex flex-col gap-y-6">
        <GiyaPayAnalytics />
        <SettlementTimeline />
        <PayoutsList />
      </div>
    </SingleColumnPage>
  )
}

export default Payouts
