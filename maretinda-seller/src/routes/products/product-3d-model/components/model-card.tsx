import { Badge, Button, Text, usePrompt } from "@medusajs/ui"
import { useState } from "react"
import { Product3DModel } from "../../../../hooks/api/product-3d-models"
import { ModelViewerElement } from "./model-viewer-element"

type ModelCardProps = {
  model: Product3DModel
  onDelete: (id: string) => void
  onSetPrimary: (id: string) => void
  isDeleting: boolean
  isSettingPrimary: boolean
}

export const ModelCard = ({
  model,
  onDelete,
  onSetPrimary,
  isDeleting,
  isSettingPrimary,
}: ModelCardProps) => {
  const [viewerOpen, setViewerOpen] = useState(false)
  const prompt = usePrompt()

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete 3D Model",
      description: "Are you sure you want to delete this 3D model? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) onDelete(model.id)
  }

  const statusConfig = {
    processing: { label: "Processing", color: "orange" as const },
    completed: { label: "Completed", color: "green" as const },
    failed: { label: "Failed", color: "red" as const },
  }

  const config = statusConfig[model.status] ?? statusConfig.processing

  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ui-border-base">
        <div className="flex items-center gap-x-2">
          <Badge color={config.color} size="2xsmall">
            {config.label}
          </Badge>
          {model.is_primary && (
            <Badge color="blue" size="2xsmall">
              Showcase
            </Badge>
          )}
        </div>
        <Text size="xsmall" className="text-ui-fg-muted">
          {new Date(model.created_at).toLocaleDateString()}
        </Text>
      </div>

      {/* Content */}
      <div className="p-4">
        {model.status === "processing" && (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center gap-x-3">
              <div className="h-2 flex-1 rounded-full bg-ui-bg-subtle overflow-hidden">
                <div
                  className="h-full rounded-full bg-ui-fg-interactive transition-all duration-500"
                  style={{ width: `${model.progress}%` }}
                />
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle shrink-0 w-9 text-right">
                {model.progress}%
              </Text>
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              AI is generating your 3D model from the source image. This usually takes 2–4 minutes.
            </Text>
            <div className="flex justify-center">
              <img
                src={model.source_image_url}
                alt="Source"
                className="h-32 w-32 rounded-lg object-cover opacity-60"
              />
            </div>
          </div>
        )}

        {model.status === "failed" && (
          <div className="flex flex-col gap-y-2">
            <Text size="small" className="text-ui-fg-subtle">
              Generation failed. {model.error_message || "Please try again."}
            </Text>
          </div>
        )}

        {model.status === "completed" && model.model_url && (
          <div className="flex flex-col gap-y-3">
            {viewerOpen ? (
              <div className="rounded-lg overflow-hidden bg-ui-bg-subtle" style={{ height: 320 }}>
                <ModelViewerElement
                  src={model.model_url}
                  poster={model.thumbnail_url ?? undefined}
                />
              </div>
            ) : (
              <div
                className="relative cursor-pointer rounded-lg overflow-hidden bg-ui-bg-subtle group"
                style={{ height: 200 }}
                onClick={() => setViewerOpen(true)}
              >
                {model.thumbnail_url ? (
                  <img
                    src={model.thumbnail_url}
                    alt="3D model preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Text className="text-ui-fg-muted">Click to load 3D viewer</Text>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-full bg-white/90 px-4 py-2">
                    <Text size="small" weight="plus">
                      Open 3D Viewer
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {(model.status === "completed" || model.status === "failed") && (
        <div className="flex items-center gap-x-2 px-4 py-3 border-t border-ui-border-base bg-ui-bg-subtle">
          {model.status === "completed" && (
            <>
              {!model.is_primary && (
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => onSetPrimary(model.id)}
                  isLoading={isSettingPrimary}
                >
                  Set as Showcase
                </Button>
              )}
              {model.model_url && (
                <Button
                  size="small"
                  variant="transparent"
                  asChild
                >
                  <a href={model.model_url} download target="_blank" rel="noreferrer">
                    Download GLB
                  </a>
                </Button>
              )}
            </>
          )}
          <div className="ml-auto">
            <Button
              size="small"
              variant="transparent"
              className="text-ui-fg-error hover:text-ui-fg-error"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
