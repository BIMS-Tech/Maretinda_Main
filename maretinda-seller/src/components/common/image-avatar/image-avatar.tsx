import { clx } from "@medusajs/ui"
import { useState } from "react"
import imagesConverter from "../../../utils/images-conventer"

function initialsOf(name?: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ImageAvatar({
  src,
  fallback,
  size = 6,
  rounded = false,
}: {
  src?: string | null
  // A name used to render initials when no image is available.
  fallback?: string | null
  size?: number
  rounded?: boolean
}) {
  const [errored, setErrored] = useState(false)
  const formattedSrc = src ? imagesConverter(src) : ""
  const showImage = !!formattedSrc && !errored

  const base = clx(
    `w-${size} h-${size} border rounded-md object-cover`,
    rounded && "rounded-full"
  )

  if (showImage) {
    return (
      <img
        src={formattedSrc}
        alt={fallback || "avatar"}
        onError={() => setErrored(true)}
        className={base}
      />
    )
  }

  // No photo (or it failed to load) → show an initials avatar instead of a
  // broken image. Common on a seller's first login before uploading a logo.
  return (
    <div
      className={clx(
        base,
        "flex items-center justify-center bg-ui-bg-base-pressed text-ui-fg-base font-semibold uppercase leading-none select-none"
      )}
      style={{ fontSize: `${Math.max(10, Math.round(size * 1.7))}px` }}
      aria-label={fallback || "avatar"}
      title={fallback || undefined}
    >
      {initialsOf(fallback)}
    </div>
  )
}
