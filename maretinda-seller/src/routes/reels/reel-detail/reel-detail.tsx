import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Textarea,
  toast,
  usePrompt,
} from "@medusajs/ui"

import { useDeleteReel, useReel, useUpdateReel } from "../../../hooks/api/reels"

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 px-4 py-3 text-center">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

export const ReelDetail = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { reel, isLoading } = useReel(id)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    status: "published",
  })

  const { mutate: update, isPending: isSaving } = useUpdateReel(id, {
    onSuccess: () => {
      toast.success("Reel updated")
      setEditing(false)
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update reel"),
  })

  const { mutate: remove } = useDeleteReel({
    onSuccess: () => {
      toast.success("Reel deleted")
      navigate("/reels")
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete reel"),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-y-3">
        <Container className="px-6 py-8 text-sm text-gray-400">
          Loading...
        </Container>
      </div>
    )
  }

  if (!reel) {
    return (
      <div className="flex flex-col gap-y-3">
        <Container className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-600">Reel not found</p>
          <Button
            className="mt-4"
            onClick={() => navigate("/reels")}
            size="small"
          >
            Back to reels
          </Button>
        </Container>
      </div>
    )
  }

  const startEditing = () => {
    setDraft({
      title: reel.title || "",
      description: reel.description || "",
      status: reel.status,
    })
    setEditing(true)
  }

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete reel",
      description:
        "Shoppers will no longer see this reel. This can't be undone.",
    })
    if (confirmed) remove(id)
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="p-0 divide-y">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">{reel.title || "Untitled reel"}</Heading>
            <p className="text-sm text-gray-500 mt-0.5">
              {reel.status === "published"
                ? `Published ${reel.published_at ? new Date(reel.published_at).toLocaleDateString() : ""}`
                : `Saved as ${reel.status}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={startEditing} size="small" variant="secondary">
              Edit
            </Button>
            <Button onClick={handleDelete} size="small" variant="danger">
              Delete
            </Button>
          </div>
        </div>

        <div className="flex gap-6 p-6">
          <video
            className="w-56 rounded-lg bg-black aspect-[9/16] object-cover shrink-0"
            controls
            poster={reel.thumbnail_url || undefined}
            src={reel.video_url}
          />

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium" htmlFor="edit-title">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                    value={draft.title}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="text-sm font-medium"
                    htmlFor="edit-description"
                  >
                    Caption
                  </Label>
                  <Textarea
                    id="edit-description"
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    rows={3}
                    value={draft.description}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Visibility</Label>
                  <Select
                    onValueChange={(value) =>
                      setDraft({ ...draft, status: value })
                    }
                    value={draft.status}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="published">Published</Select.Item>
                      <Select.Item value="draft">Draft</Select.Item>
                      <Select.Item value="archived">Archived</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={isSaving}
                    isLoading={isSaving}
                    onClick={() =>
                      update({
                        title: draft.title,
                        description: draft.description,
                        status: draft.status,
                      })
                    }
                    size="small"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditing(false)}
                    size="small"
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {reel.description || "No caption"}
                </p>
                <div className="mt-6 flex divide-x border rounded-lg">
                  <Stat label="Views" value={reel.view_count} />
                  <Stat label="Likes" value={reel.like_count} />
                </div>
                <p className="mt-4 text-xs text-gray-400">
                  Shoppers message you directly from this reel — replies land in
                  your Messages inbox.
                </p>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}
