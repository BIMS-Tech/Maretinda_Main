import { Photo } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

type ThumbnailProps = {
  src?: string | null
  alt?: string
  size?: "small" | "base"
}

export const Thumbnail = ({ src, alt, size = "base" }: ThumbnailProps) => {
  // Process URL to ensure it's absolute
  const imageUrl = src && src.trim() ? (
    src.startsWith('http') ? src : 
    src.startsWith('/') ? `${import.meta.env.VITE_MEDUSA_BACKEND_URL || 'http://localhost:9000'}${src}` :
    `${import.meta.env.VITE_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/${src}`
  ) : null

  return (
    <div
      className={clx(
        "bg-ui-bg-component border-ui-border-base flex items-center justify-center overflow-hidden rounded border",
        {
          "h-8 w-6": size === "base",
          "h-5 w-4": size === "small",
        }
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt || 'Thumbnail'}
          className="h-full w-full object-cover object-center"
          onError={(e) => {
            console.error('Thumbnail load error:', imageUrl)
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <Photo className="text-ui-fg-subtle" />
      )}
    </div>
  )
}
