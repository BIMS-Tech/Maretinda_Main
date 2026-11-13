import { Button, Container, Heading, StatusBadge, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/client"
import { MEDUSA_STOREFRONT_URL } from "../../lib/storefront"

type Status = "open" | "resolved" | "dismissed"

type Report = {
  id: string
  kind: "product" | "seller"
  target_id: string
  target_label: string | null
  target_handle: string | null
  seller_id: string | null
  seller_name: string | null
  reason: string
  comment: string
  reporter_email: string | null
  status: Status
  admin_note: string | null
  created_at: string
}

const TABS: { value: Status; label: string; color: "orange" | "green" | "grey" }[] = [
  { value: "open", label: "Open", color: "orange" },
  { value: "resolved", label: "Acted on", color: "green" },
  { value: "dismissed", label: "Dismissed", color: "grey" },
]

const when = (d: string) =>
  new Date(d).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
const KEY = ["admin", "listing-reports"]

/**
 * Buyers' reports of products and shops. An admin reads each one, acts on the
 * listing or shop from its own page, then closes the report with a note.
 */
export const ListingReportsPage = () => {
  const client = useQueryClient()
  const [status, setStatus] = useState<Status>("open")
  const [notes, setNotes] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: [...KEY, status],
    queryFn: () =>
      sdk.client.fetch<{ reports: Report[]; count: number; open: number }>("/admin/listing-reports", {
        method: "GET",
        query: { status, limit: 100 },
      }),
  })

  const close = useMutation({
    mutationFn: ({ id, to }: { id: string; to: Status }) =>
      sdk.client.fetch(`/admin/listing-reports/${id}`, { method: "POST", body: { status: to, admin_note: notes[id] || undefined } }),
    onSuccess: () => {
      toast.success("Report updated")
      client.invalidateQueries({ queryKey: KEY })
    },
    onError: (e: any) => toast.error(e?.message || "Could not update the report"),
  })

  const rows = data?.reports ?? []

  return (
    <Container className="p-0 divide-y">
      <div className="px-6 py-4">
        <Heading>Listing Reports</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          Products and shops that buyers reported from the storefront. Check the listing, act on it from its own page, then close the report.
        </Text>
      </div>

      <div className="flex gap-2 px-6 py-3">
        {TABS.map((t) => (
          <Button key={t.value} size="small" variant={status === t.value ? "primary" : "secondary"} onClick={() => setStatus(t.value)}>
            {t.label}
            {t.value === "open" && data?.open ? ` (${data.open})` : ""}
          </Button>
        ))}
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : rows.length === 0 ? (
          <Text className="text-ui-fg-subtle">No {TABS.find((t) => t.value === status)!.label.toLowerCase()} reports.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Reported</Table.HeaderCell>
                <Table.HeaderCell>What</Table.HeaderCell>
                <Table.HeaderCell>Reason and details</Table.HeaderCell>
                <Table.HeaderCell>Reporter</Table.HeaderCell>
                <Table.HeaderCell>Decision</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((r) => {
                const tab = TABS.find((t) => t.value === r.status)!
                const adminPath = r.kind === "product" ? `/products/${r.target_id}` : `/sellers/${r.target_id}`
                const storePath = r.target_handle
                  ? `${MEDUSA_STOREFRONT_URL}/${r.kind === "product" ? "products" : "sellers"}/${r.target_handle}`
                  : null
                return (
                  <Table.Row key={r.id} className="align-top">
                    <Table.Cell className="whitespace-nowrap py-3">{when(r.created_at)}</Table.Cell>
                    <Table.Cell className="py-3">
                      <Link to={adminPath} className="text-ui-fg-interactive">
                        {r.target_label || r.target_id}
                      </Link>
                      <Text size="xsmall" className="text-ui-fg-muted">
                        {r.kind === "product" ? `Product${r.seller_name ? ` by ${r.seller_name}` : ""}` : "Shop"}
                        {storePath && (
                          <>
                            {" · "}
                            <a href={storePath} target="_blank" rel="noreferrer" className="text-ui-fg-interactive">
                              view on store
                            </a>
                          </>
                        )}
                      </Text>
                    </Table.Cell>
                    <Table.Cell className="max-w-[360px] whitespace-normal py-3">
                      <Text size="small" weight="plus">{r.reason}</Text>
                      <Text size="small" className="break-words text-ui-fg-subtle">{r.comment}</Text>
                    </Table.Cell>
                    <Table.Cell className="py-3">{r.reporter_email || "—"}</Table.Cell>
                    <Table.Cell className="min-w-[240px] py-3">
                      {r.status === "open" ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            rows={2}
                            placeholder="What was done (optional)"
                            value={notes[r.id] ?? ""}
                            onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <Button size="small" isLoading={close.isPending} onClick={() => close.mutate({ id: r.id, to: "resolved" })}>
                              Acted on
                            </Button>
                            <Button size="small" variant="secondary" isLoading={close.isPending} onClick={() => close.mutate({ id: r.id, to: "dismissed" })}>
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge color={tab.color}>{tab.label}</StatusBadge>
                          {r.admin_note && <Text size="small" className="whitespace-normal text-ui-fg-subtle">{r.admin_note}</Text>}
                          <Button size="small" variant="transparent" onClick={() => close.mutate({ id: r.id, to: "open" })}>
                            Reopen
                          </Button>
                        </div>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}
