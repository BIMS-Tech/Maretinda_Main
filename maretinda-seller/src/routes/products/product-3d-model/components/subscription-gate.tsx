import { Button, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

type SubscriptionGateProps = {
  currentPlan: string | null
}

export const SubscriptionGate = ({ currentPlan }: SubscriptionGateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-6 py-16 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ui-bg-subtle text-4xl">
        🔒
      </div>
      <div className="flex flex-col items-center gap-y-2 max-w-sm">
        <Heading level="h2">Premium Feature</Heading>
        <Text className="text-ui-fg-subtle">
          3D Model Generation is available on <strong>Boost</strong> and{" "}
          <strong>Managed</strong> subscription plans. Upgrade to bring your
          products to life with AI-generated 3D models.
        </Text>
        {currentPlan && (
          <Text size="small" className="text-ui-fg-muted mt-1">
            Your current plan: <strong>{currentPlan}</strong>
          </Text>
        )}
      </div>
      <Button asChild>
        <Link to="/subscription">Upgrade Subscription</Link>
      </Button>
    </div>
  )
}
