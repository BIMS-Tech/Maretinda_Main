import { Divider, Heading, Text, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useSubscriptionStatus } from "../../../../hooks/api/subscription"
import {
  useDelete3DModel,
  useGenerate3DModel,
  useProduct3DModels,
  useSetPrimary3DModel,
} from "../../../../hooks/api/product-3d-models"
import { GenerateForm } from "./generate-form"
import { ModelCard } from "./model-card"
import { SubscriptionGate } from "./subscription-gate"

const ELIGIBLE_PLANS = ["Growth", "Premium"]
const PLAN_ALIASES: Record<string, string> = { Foundation: "Starter", Boost: "Growth", Managed: "Premium" }

type Product3DModelViewProps = {
  product: HttpTypes.AdminProduct
}

export const Product3DModelView = ({ product }: Product3DModelViewProps) => {
  const { data: subData, isLoading: subLoading } = useSubscriptionStatus()
  const { data: modelsData, isLoading: modelsLoading } = useProduct3DModels(product.id)

  const generate = useGenerate3DModel(product.id)
  const deleteModel = useDelete3DModel(product.id)
  const setPrimary = useSetPrimary3DModel(product.id)

  const rawPlan = subData?.plan?.name ?? null
  const planName = rawPlan ? (PLAN_ALIASES[rawPlan] ?? rawPlan) : null
  const isEligible = planName ? ELIGIBLE_PLANS.includes(planName) : false

  const models = modelsData?.models ?? []

  const handleGenerate = async (imageUrl: string) => {
    try {
      await generate.mutateAsync({ product_id: product.id, image_url: imageUrl })
      toast.success("3D generation started", {
        description: "Your 3D model will be ready in a few minutes.",
      })
    } catch (err: any) {
      toast.error("Generation failed", {
        description: err.message ?? "Please try again.",
      })
    }
  }

  const handleDelete = async (modelId: string) => {
    try {
      await deleteModel.mutateAsync(modelId)
      toast.success("Model deleted")
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message })
    }
  }

  const handleSetPrimary = async (modelId: string) => {
    try {
      await setPrimary.mutateAsync(modelId)
      toast.success("Showcase model updated", {
        description: "This 3D model will be displayed on your product showcase.",
      })
    } catch (err: any) {
      toast.error("Failed to update showcase", { description: err.message })
    }
  }

  if (subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ui-fg-muted">Loading...</div>
      </div>
    )
  }

  if (!isEligible) {
    return <SubscriptionGate currentPlan={planName} />
  }

  return (
    <div className="flex flex-col gap-y-8 py-6 px-6">
      {/* Header */}
      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <Heading level="h1">3D Model Generator</Heading>
          <span className="rounded-md bg-gradient-to-r from-violet-600 to-blue-500 px-2 py-0.5 text-xs font-medium text-white">
            Premium
          </span>
        </div>
        <Text className="text-ui-fg-subtle">
          Generate AI-powered 3D models from your product images. Use them to create
          immersive product showcases for your customers.
        </Text>
      </div>

      <Divider />

      {/* Generate Form */}
      <GenerateForm
        product={product}
        onGenerate={handleGenerate}
        isGenerating={generate.isPending}
      />

      {/* Models List */}
      {(modelsLoading || models.length > 0) && (
        <>
          <Divider />
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">Generated Models</Heading>
            {modelsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-xl border border-ui-border-base bg-ui-bg-subtle animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {models.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onDelete={handleDelete}
                    onSetPrimary={handleSetPrimary}
                    isDeleting={deleteModel.isPending && deleteModel.variables === model.id}
                    isSettingPrimary={setPrimary.isPending && setPrimary.variables === model.id}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!modelsLoading && models.length === 0 && (
        <div className="flex flex-col items-center gap-y-3 py-10 text-center">
          <div className="text-4xl">🎲</div>
          <Text className="text-ui-fg-subtle">
            No 3D models generated yet. Select a product image above and click
            "Generate 3D Model" to get started.
          </Text>
        </div>
      )}
    </div>
  )
}
