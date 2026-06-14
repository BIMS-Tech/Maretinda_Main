import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { Link } from "react-router-dom"
import { useSubscriptionStatus } from "../../../../../hooks/api/subscription"
import { useProduct3DModels } from "../../../../../hooks/api/product-3d-models"

type Product3DModelSectionProps = {
  product: HttpTypes.AdminProduct
}

const ELIGIBLE_PLANS = ["Growth", "Premium"]

export const Product3DModelSection = ({ product }: Product3DModelSectionProps) => {
  const { data: subData, isLoading: subLoading } = useSubscriptionStatus()
  const planName = subData?.plan?.name ?? null
  const isEligible = planName ? ELIGIBLE_PLANS.includes(planName) : false

  const { data: modelsData } = useProduct3DModels(product.id)
  const models = modelsData?.models ?? []
  const primaryModel = models.find((m) => m.is_primary && m.status === "completed")
  const processingCount = models.filter((m) => m.status === "processing").length
  const completedCount = models.filter((m) => m.status === "completed").length

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">3D Model</Heading>
          <span className="rounded-md bg-gradient-to-r from-violet-600 to-blue-500 px-2 py-0.5 text-xs font-medium text-white leading-tight">
            Premium
          </span>
        </div>

        {isEligible && (
          <Button size="small" variant="secondary" asChild>
            <Link to="3d-model">Manage</Link>
          </Button>
        )}
      </div>

      <div className="px-6 py-4">
        {subLoading ? (
          <div className="h-6 w-32 animate-pulse rounded bg-ui-bg-subtle" />
        ) : !isEligible ? (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center gap-x-2">
              <span className="text-lg">🔒</span>
              <Text size="small" className="text-ui-fg-subtle">
                Available on Growth and Premium plans
              </Text>
            </div>
            <Button size="small" variant="secondary" asChild>
              <Link to="/subscription">Upgrade to unlock</Link>
            </Button>
          </div>
        ) : primaryModel ? (
          <div className="flex items-start gap-x-4">
            {primaryModel.thumbnail_url && (
              <img
                src={primaryModel.thumbnail_url}
                alt="3D model preview"
                className="h-16 w-16 rounded-lg object-cover border border-ui-border-base shrink-0"
              />
            )}
            <div className="flex flex-col gap-y-1">
              <div className="flex items-center gap-x-2">
                <Badge color="green" size="2xsmall">Active 3D Model</Badge>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted">
                {completedCount} model{completedCount !== 1 ? "s" : ""} generated
                {processingCount > 0 && `, ${processingCount} processing`}
              </Text>
            </div>
          </div>
        ) : models.length > 0 ? (
          <div className="flex flex-col gap-y-2">
            {processingCount > 0 && (
              <Text size="small" className="text-ui-fg-subtle">
                {processingCount} model{processingCount !== 1 ? "s" : ""} generating...
              </Text>
            )}
            {completedCount > 0 && (
              <Text size="small" className="text-ui-fg-subtle">
                {completedCount} model{completedCount !== 1 ? "s" : ""} ready — open Manage to set showcase
              </Text>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-y-3">
            <Text size="small" className="text-ui-fg-subtle">
              No 3D models generated yet. Create one to showcase your product in 3D.
            </Text>
            <Button size="small" variant="secondary" asChild>
              <Link to="3d-model">Generate 3D Model</Link>
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}
