import { Button, Input, Text, Tooltip, clx } from "@medusajs/ui"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

type GenerateFormProps = {
  product: HttpTypes.AdminProduct
  onGenerate: (imageUrl: string) => void
  isGenerating: boolean
}

export const GenerateForm = ({ product, onGenerate, isGenerating }: GenerateFormProps) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [customUrl, setCustomUrl] = useState("")

  const productImages = product.images ?? []
  const thumbnailUrl = product.thumbnail

  const effectiveUrl = selectedImageUrl ?? customUrl.trim()

  const handleGenerate = () => {
    if (!effectiveUrl) return
    onGenerate(effectiveUrl)
    setSelectedImageUrl(null)
    setCustomUrl("")
  }

  return (
    <div className="flex flex-col gap-y-5">
      <div className="flex flex-col gap-y-2">
        <Text size="small" weight="plus">
          Select a product image to generate a 3D model from
        </Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          For best results, use a clean image with a white or neutral background.
        </Text>
      </div>

      {productImages.length > 0 || thumbnailUrl ? (
        <div className="flex flex-wrap gap-3">
          {thumbnailUrl && !productImages.some((i) => i.url === thumbnailUrl) && (
            <ImageOption
              url={thumbnailUrl}
              label="Thumbnail"
              selected={selectedImageUrl === thumbnailUrl}
              onSelect={() => {
                setSelectedImageUrl(thumbnailUrl)
                setCustomUrl("")
              }}
            />
          )}
          {productImages.map((image, i) => (
            <ImageOption
              key={image.id}
              url={image.url}
              label={`Image ${i + 1}`}
              selected={selectedImageUrl === image.url}
              onSelect={() => {
                setSelectedImageUrl(image.url)
                setCustomUrl("")
              }}
            />
          ))}
        </div>
      ) : (
        <Text size="small" className="text-ui-fg-muted italic">
          No product images found. Paste an image URL below.
        </Text>
      )}

      <div className="flex flex-col gap-y-2">
        <Text size="small" weight="plus">
          Or paste an image URL
        </Text>
        <div className="flex gap-x-2">
          <Input
            size="small"
            placeholder="https://example.com/product-image.jpg"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value)
              setSelectedImageUrl(null)
            }}
            className="flex-1"
          />
        </div>
      </div>

      {effectiveUrl && (
        <div className="flex items-start gap-x-3 p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
          <img
            src={effectiveUrl}
            alt="Selected source"
            className="h-14 w-14 rounded-md object-cover shrink-0"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
          <div className="flex flex-col gap-y-1">
            <Text size="xsmall" weight="plus">
              Selected source image
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted break-all line-clamp-2">
              {effectiveUrl}
            </Text>
          </div>
        </div>
      )}

      <div className="flex items-center gap-x-3">
        <Button
          onClick={handleGenerate}
          disabled={!effectiveUrl}
          isLoading={isGenerating}
        >
          Generate 3D Model
        </Button>
        <Tooltip content="Powered by Meshy.ai. Generation takes 2–4 minutes.">
          <Text size="xsmall" className="text-ui-fg-muted cursor-help underline decoration-dashed">
            How does this work?
          </Text>
        </Tooltip>
      </div>
    </div>
  )
}

type ImageOptionProps = {
  url: string
  label: string
  selected: boolean
  onSelect: () => void
}

const ImageOption = ({ url, label, selected, onSelect }: ImageOptionProps) => (
  <button
    onClick={onSelect}
    className={clx(
      "relative rounded-lg overflow-hidden border-2 transition-all",
      "hover:border-ui-border-interactive",
      selected ? "border-ui-border-interactive ring-2 ring-ui-border-interactive" : "border-ui-border-base"
    )}
  >
    <img src={url} alt={label} className="h-20 w-20 object-cover" />
    {selected && (
      <div className="absolute inset-0 flex items-center justify-center bg-ui-fg-interactive/20">
        <div className="h-5 w-5 rounded-full bg-ui-fg-interactive flex items-center justify-center text-white text-xs">
          ✓
        </div>
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
      <span className="text-white text-xs">{label}</span>
    </div>
  </button>
)
