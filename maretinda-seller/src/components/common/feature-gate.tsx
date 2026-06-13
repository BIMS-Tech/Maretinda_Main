import { Button, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { useSubscriptionStatus } from "../../hooks/api/subscription"

interface FeatureGateProps {
  requiredPlans: string[]
  featureName: string
  description: string
  children?: React.ReactNode
  comingSoon?: boolean
}

export const FeatureGate = ({
  requiredPlans,
  featureName,
  description,
  children,
  comingSoon = false,
}: FeatureGateProps) => {
  const { data, isLoading } = useSubscriptionStatus()

  if (isLoading) return null

  const planName = data?.subscription?.plan_name ?? null
  const hasAccess = planName !== null && requiredPlans.includes(planName)

  if (hasAccess && !comingSoon) {
    return <>{children}</>
  }

  if (hasAccess && comingSoon) {
    return (
      <div className="flex flex-col items-center justify-center gap-y-6 py-16 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ui-bg-subtle text-4xl">
          🚀
        </div>
        <div className="flex flex-col items-center gap-y-2 max-w-sm">
          <Heading level="h2">{featureName} — Coming Soon</Heading>
          <Text className="text-ui-fg-subtle">
            We're working on bringing this feature to you. Stay tuned!
          </Text>
          {planName && (
            <Text size="small" className="text-ui-fg-muted mt-1">
              Your current plan: <strong>{planName}</strong>
            </Text>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-y-6 py-16 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ui-bg-subtle text-4xl">
        🔒
      </div>
      <div className="flex flex-col items-center gap-y-2 max-w-sm">
        <Heading level="h2">Premium Feature</Heading>
        <Text className="text-ui-fg-subtle">
          {description} Available on{" "}
          <strong>{requiredPlans.join(" and ")}</strong> plans.
        </Text>
        {planName && (
          <Text size="small" className="text-ui-fg-muted mt-1">
            Your current plan: <strong>{planName}</strong>
          </Text>
        )}
      </div>
      <Button asChild>
        <Link to="/subscription">Upgrade Subscription</Link>
      </Button>
    </div>
  )
}
