import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Button,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Textarea,
  toast,
} from "@medusajs/ui"

import { useCreateReel } from "../../../hooks/api/reels"
import { uploadReelVideoQuery } from "../../../lib/client"

const MAX_VIDEO_BYTES = 150 * 1024 * 1024
const MAX_DURATION_SECONDS = 180

/**
 * Reads duration and a mid-point poster frame straight from the selected file
 * so sellers get a thumbnail without a second upload step. Falls back to no
 * poster if the browser can't decode the container (e.g. some .mov files).
 */
async function extractPoster(file: File): Promise<{
  duration: number | null
  poster: File | null
  previewUrl: string
}> {
  const previewUrl = URL.createObjectURL(file)

  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.muted = true
    video.src = previewUrl

    const bail = () => resolve({ duration: null, poster: null, previewUrl })

    video.onerror = bail
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration)
        ? Math.round(video.duration)
        : null
      video.currentTime = Math.min(1, video.duration / 2 || 0)

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext("2d")
          if (!ctx || !canvas.width)
            return resolve({ duration, poster: null, previewUrl })

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              const poster = blob
                ? new File([blob], "poster.jpg", { type: "image/jpeg" })
                : null
              resolve({ duration, poster, previewUrl })
            },
            "image/jpeg",
            0.85
          )
        } catch {
          resolve({ duration, poster: null, previewUrl })
        }
      }
    }
  })
}

export const ReelCreate = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [video, setVideo] = useState<{
    file: File
    previewUrl: string
    duration: number | null
    poster: File | null
  } | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "published",
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const { mutate: create, isPending } = useCreateReel({
    onSuccess: (data) => {
      toast.success(
        data.reel.status === "published"
          ? "Reel published"
          : "Reel saved as draft"
      )
      navigate(`../${data.reel.id}`)
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create reel"),
  })

  const handleClose = () => {
    if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl)
    setOpen(false)
    navigate("..")
  }

  const handleFile = async (file?: File) => {
    if (!file) return

    if (!file.type.startsWith("video/")) {
      toast.error("Choose a video file")
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video is larger than 150MB")
      return
    }

    const { duration, poster, previewUrl } = await extractPoster(file)
    if (duration && duration > MAX_DURATION_SECONDS) {
      URL.revokeObjectURL(previewUrl)
      toast.error(
        `Reels can be at most ${MAX_DURATION_SECONDS / 60} minutes long`
      )
      return
    }

    setVideo({ file, previewUrl, duration, poster })
  }

  const handleSubmit = async () => {
    if (!video) {
      toast.error("Upload a video first")
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadReelVideoQuery(video.file, video.poster)
      if (!uploaded.video?.url) {
        throw new Error(uploaded.errors?.[0]?.error || "Video upload failed")
      }

      create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        video_url: uploaded.video.url,
        thumbnail_url: uploaded.poster?.url || undefined,
        duration: video.duration ?? undefined,
        status: form.status,
      })
    } catch (err: any) {
      toast.error(err?.message || "Video upload failed")
    } finally {
      setUploading(false)
    }
  }

  const busy = uploading || isPending

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : handleClose())}
    >
      <Drawer.Content>
        <Drawer.Header>
          <Heading level="h2">Post a Reel</Heading>
          <p className="text-sm text-gray-500 mt-1">
            Vertical videos work best (9:16), up to 3 minutes and 150MB.
          </p>
        </Drawer.Header>

        <Drawer.Body className="p-6 overflow-y-auto">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Video *</Label>

              {video ? (
                <div className="flex gap-4">
                  <video
                    className="w-32 rounded-lg bg-black aspect-[9/16] object-cover"
                    controls
                    src={video.previewUrl}
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="font-medium text-gray-700 break-all">
                      {video.file.name}
                    </div>
                    <div>{(video.file.size / 1024 / 1024).toFixed(1)} MB</div>
                    {video.duration ? <div>{video.duration}s</div> : null}
                    <div>
                      {video.poster
                        ? "Thumbnail captured"
                        : "No thumbnail — first frame will be used"}
                    </div>
                    <Button
                      onClick={() => {
                        URL.revokeObjectURL(video.previewUrl)
                        setVideo(null)
                      }}
                      size="small"
                      variant="transparent"
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full border border-dashed rounded-lg py-10 text-sm text-gray-500 hover:bg-gray-50"
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  Click to choose a video
                </button>
              )}

              <input
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
                ref={inputRef}
                type="file"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium" htmlFor="reel-title">
                Title
              </Label>
              <Input
                id="reel-title"
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Unboxing our bestseller"
                value={form.title}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium" htmlFor="reel-description">
                Caption
              </Label>
              <Textarea
                id="reel-description"
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Tell shoppers what they're looking at"
                rows={3}
                value={form.description}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Visibility</Label>
              <Select
                onValueChange={(value) => setForm({ ...form, status: value })}
                value={form.status}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="published">Publish now</Select.Item>
                  <Select.Item value="draft">Save as draft</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Button disabled={busy} onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={busy || !video}
            isLoading={busy}
            onClick={handleSubmit}
          >
            {uploading
              ? "Uploading..."
              : form.status === "published"
                ? "Publish"
                : "Save draft"}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
