import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  StatusBadge,
  Table,
  Tabs,
  Text,
  Textarea,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useState } from "react"
import { AdminReel, useAdminReels, useHideReel, useRemoveReel, useUnhideReel } from "../../hooks/api/reels"

const PAGE_SIZE = 20

type Filter = "all" | "visible" | "hidden"

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

/**
 * Seller reels, for moderation. Hiding takes a reel off the storefront and
 * shows the seller the reason; removing deletes it.
 */
export const ReelsPage = () => {
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [hiding, setHiding] = useState<AdminReel | null>(null)
  const [reason, setReason] = useState("")

  const { data, isLoading } = useAdminReels({
    moderation_status: filter === "all" ? undefined : filter,
    q: search.trim() || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const hide = useHideReel()
  const unhide = useUnhideReel()
  const remove = useRemoveReel()
  const prompt = usePrompt()

  const reels = data?.reels ?? []
  const count = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const submitHide = async () => {
    if (!hiding || !reason.trim()) return
    try {
      await hide.mutateAsync({ id: hiding.id, reason: reason.trim() })
      toast.success("Reel hidden from the storefront")
      setHiding(null)
      setReason("")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't hide the reel")
    }
  }

  const handleUnhide = async (reel: AdminReel) => {
    try {
      await unhide.mutateAsync({ id: reel.id })
      toast.success("Reel is back on the storefront")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't restore the reel")
    }
  }

  const handleRemove = async (reel: AdminReel) => {
    const confirmed = await prompt({
      title: "Remove this reel?",
      description: `"${reel.title || "Untitled"}" by ${reel.seller_name} will be deleted for good.`,
      confirmText: "Remove",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    try {
      await remove.mutateAsync({ id: reel.id })
      toast.success("Reel removed")
    } catch (e) {
      toast.error((e as Error).message || "Couldn't remove the reel")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading>Seller reels</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Hide a reel to take it off the storefront. The seller sees your reason.
          </Text>
        </div>
        <Input
          className="md:w-64"
          placeholder="Search title or shop"
          size="small"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
      </div>

      <div className="px-6 py-3">
        <Tabs
          value={filter}
          onValueChange={(v) => {
            setFilter(v as Filter)
            setPage(0)
          }}
        >
          <Tabs.List>
            <Tabs.Trigger value="all">All</Tabs.Trigger>
            <Tabs.Trigger value="visible">Visible</Tabs.Trigger>
            <Tabs.Trigger value="hidden">Hidden</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Reel</Table.HeaderCell>
            <Table.HeaderCell>Shop</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Views</Table.HeaderCell>
            <Table.HeaderCell>Posted</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row><Table.Cell colSpan={6} className="text-center py-8 text-ui-fg-subtle">Loading…</Table.Cell></Table.Row>
          )}
          {!isLoading && reels.length === 0 && (
            <Table.Row><Table.Cell colSpan={6} className="text-center py-8 text-ui-fg-subtle">No reels match.</Table.Cell></Table.Row>
          )}
          {reels.map((reel) => (
            <Table.Row key={reel.id}>
              <Table.Cell>
                <a
                  className="flex items-center gap-3 hover:underline"
                  href={reel.video_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {reel.thumbnail_url ? (
                    <img alt="" className="h-12 w-8 rounded object-cover" src={reel.thumbnail_url} />
                  ) : (
                    <div className="bg-ui-bg-subtle h-12 w-8 rounded" />
                  )}
                  <span className="max-w-[220px] truncate">{reel.title || "Untitled"}</span>
                </a>
              </Table.Cell>
              <Table.Cell>{reel.seller_name}</Table.Cell>
              <Table.Cell>
                {reel.moderation_status === "hidden" ? (
                  <div className="flex flex-col gap-1">
                    <StatusBadge color="red">Hidden</StatusBadge>
                    {reel.moderation_reason && (
                      <Text size="xsmall" className="text-ui-fg-subtle max-w-[220px] truncate" title={reel.moderation_reason}>
                        {reel.moderation_reason}
                      </Text>
                    )}
                  </div>
                ) : (
                  <StatusBadge color={reel.status === "published" ? "green" : "grey"}>
                    {reel.status === "published" ? "Live" : reel.status === "draft" ? "Draft" : "Archived"}
                  </StatusBadge>
                )}
              </Table.Cell>
              <Table.Cell className="text-right">{reel.view_count}</Table.Cell>
              <Table.Cell>{formatDate(reel.created_at)}</Table.Cell>
              <Table.Cell>
                <div className="flex justify-end gap-2">
                  {reel.moderation_status === "hidden" ? (
                    <Button size="small" variant="secondary" isLoading={unhide.isPending} onClick={() => handleUnhide(reel)}>
                      Unhide
                    </Button>
                  ) : (
                    <Button size="small" variant="secondary" onClick={() => setHiding(reel)}>
                      Hide
                    </Button>
                  )}
                  <Button size="small" variant="danger" onClick={() => handleRemove(reel)}>
                    Remove
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {count} reel{count === 1 ? "" : "s"}
        </Text>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Text size="small">
            {page + 1} / {pageCount}
          </Text>
          <Button size="small" variant="secondary" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Drawer
        open={!!hiding}
        onOpenChange={(open) => {
          if (!open) {
            setHiding(null)
            setReason("")
          }
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Hide reel</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-3">
            <Text size="small">
              "{hiding?.title || "Untitled"}" by {hiding?.seller_name} will leave the storefront. The seller sees
              the reason below and can't republish it.
            </Text>
            <Label htmlFor="hide-reason">Reason</Label>
            <Textarea
              id="hide-reason"
              placeholder="For example: shows a counterfeit brand"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Drawer.Close>
            <Button disabled={!reason.trim()} isLoading={hide.isPending} onClick={submitHide}>
              Hide reel
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}
