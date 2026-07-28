import { MediaPlay } from "@medusajs/icons"
import { Button, Container, Heading } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"

import { Reel, ReelStatus, useReels } from "../../../../hooks/api/reels"

const STATUS_STYLE: Record<ReelStatus, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  archived: "bg-orange-100 text-orange-700",
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${String(secs).padStart(2, "0")}`
}

function ReelCard({ reel }: { reel: Reel }) {
  const navigate = useNavigate()
  const duration = formatDuration(reel.duration)

  return (
    <button
      className="group text-left rounded-lg border border-ui-border-base overflow-hidden hover:shadow-md transition-shadow"
      onClick={() => navigate(reel.id)}
      type="button"
    >
      <div className="relative aspect-[9/16] bg-gray-900">
        {reel.thumbnail_url ? (
          <img
            alt={reel.title || "Reel"}
            className="w-full h-full object-cover"
            src={reel.thumbnail_url}
          />
        ) : (
          <video
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            src={`${reel.video_url}#t=0.1`}
          />
        )}

        <span
          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[reel.status]}`}
        >
          {reel.status}
        </span>

        {duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[11px]">
            {duration}
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="text-sm font-medium text-gray-900 truncate">
          {reel.title || "Untitled reel"}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span>{reel.view_count} views</span>
          <span>{reel.like_count} likes</span>
        </div>
      </div>
    </button>
  )
}

export const ReelListTable = () => {
  const { reels = [], count = 0, isLoading } = useReels({ limit: 50 })
  const navigate = useNavigate()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Reels</Heading>
          <p className="text-sm text-gray-500 mt-0.5">
            Short videos shown on your shop page and the storefront reels feed
            {count > 0 ? ` — ${count} total` : ""}
          </p>
        </div>
        <Button
          onClick={() => navigate("create")}
          size="small"
          variant="secondary"
        >
          Post a reel
        </Button>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">
          Loading...
        </div>
      ) : reels.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <MediaPlay className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No reels yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Post a short vertical video to show your products in action
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate("create")}
            size="small"
          >
            Post your first reel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
          {reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      )}
    </Container>
  )
}
