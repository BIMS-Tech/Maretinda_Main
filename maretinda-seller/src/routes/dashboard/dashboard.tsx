import { useEffect, useState } from "react"
import { useOnboarding, useOrders } from "../../hooks/api"
import { usePlanLimits } from "../../hooks/api/plan-limits"
import { DashboardCharts } from "./components/dashboard-charts"
import { DashboardOnboarding } from "./components/dashboard-onboarding"
import { ChartSkeleton } from "./components/chart-skeleton"
import { useReviews } from "../../hooks/api/review"
import { SetupChecklist } from "../../components/common/setup-checklist"
import { Stagger, StaggerItem } from "../../components/common/motion/motion"
import { DashboardHero } from "./components/dashboard-hero"

export const Dashboard = () => {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  const { onboarding, isError, error, isPending } = useOnboarding()
  const { analyticsLevel, canExport } = usePlanLimits()

  const { orders, isPending: isPendingOrders } = useOrders()
  const { reviews, isPending: isPendingReviews } = useReviews()

  const notFulfilledOrders =
    orders?.filter((order) => order.fulfillment_status === "not_fulfilled")
      .length || 0
  const fulfilledOrders =
    orders?.filter((order) => order.fulfillment_status === "fulfilled")
      .length || 0
  const reviewsToReply =
    reviews?.filter((review: any) => !review?.seller_note).length || 0

  if (!isClient) return null

  if (isPending || isPendingOrders || isPendingReviews) {
    return (
      <div>
        <ChartSkeleton />
      </div>
    )
  }

  if (isError) {
    throw error
  }

  const onboardingIncomplete =
    !onboarding?.products ||
    !onboarding?.locations_shipping ||
    !onboarding?.store_information

  return (
    <Stagger className="flex flex-col gap-y-3">
      <StaggerItem>
        <DashboardHero />
      </StaggerItem>
      <StaggerItem>
        <SetupChecklist />
      </StaggerItem>
      <StaggerItem>
        {onboardingIncomplete ? (
          <DashboardOnboarding
            products={onboarding?.products}
            locations_shipping={onboarding?.locations_shipping}
            store_information={onboarding?.store_information}
          />
        ) : (
          <DashboardCharts
            notFulfilledOrders={notFulfilledOrders}
            fulfilledOrders={fulfilledOrders}
            reviewsToReply={reviewsToReply}
            analyticsLevel={analyticsLevel}
            canExport={canExport}
          />
        )}
      </StaggerItem>
    </Stagger>
  )
}
