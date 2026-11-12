import { Button, Container, Heading, Input, StatusBadge, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type Entry = {
  id: string
  actor_id: string | null
  actor_email: string | null
  method: string
  path: string
  status: number
  ip: string | null
  body: unknown
  created_at: string
}

const PAGE = 50
const when = (d: string) =>
  new Date(d).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

/** Every change made through the admin: who did it, what they called, and whether it went through. */
export const AuditLogPage = () => {
  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log", applied, page],
    queryFn: () =>
      sdk.client.fetch<{ entries: Entry[]; count: number }>("/admin/audit-log", {
        method: "GET",
        query: { limit: PAGE, offset: page * PAGE, ...(applied ? { q: applied } : {}) },
      }),
  })
  const entries = data?.entries ?? []
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE))

  return (
    <Container className="p-0 divide-y">
      <div className="flex flex-wrap items-end justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Audit Log</Heading>
          <Text size="small" className="text-ui-fg-subtle">Changes made through the admin panel. Passwords, keys and account numbers are never stored.</Text>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(0)
            setApplied(search.trim())
          }}
        >
          <Input size="small" placeholder="Filter by path, e.g. sellers" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Filter by path" />
          <Button size="small" variant="secondary" type="submit">Filter</Button>
        </form>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : entries.length === 0 ? (
          <Text className="text-ui-fg-subtle">No changes recorded yet.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>When</Table.HeaderCell>
                <Table.HeaderCell>Who</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
                <Table.HeaderCell>Result</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {entries.map((e) => (
                <Table.Row key={e.id}>
                  <Table.Cell className="whitespace-nowrap">{when(e.created_at)}</Table.Cell>
                  <Table.Cell>{e.actor_email || e.actor_id || "Unknown"}</Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="font-mono break-all">{e.method} {e.path}</Text>
                    {open === e.id && (
                      <pre className="mt-2 max-w-[520px] overflow-x-auto rounded bg-ui-bg-subtle p-2 text-xs">{JSON.stringify(e.body, null, 2)}</pre>
                    )}
                  </Table.Cell>
                  <Table.Cell><StatusBadge color={e.status < 400 ? "green" : "red"}>{e.status}</StatusBadge></Table.Cell>
                  <Table.Cell>
                    {e.body ? (
                      <Button size="small" variant="transparent" onClick={() => setOpen(open === e.id ? null : e.id)}>
                        {open === e.id ? "Hide" : "Details"}
                      </Button>
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Text size="xsmall" className="text-ui-fg-muted">Page {page + 1} of {pages} · {data?.count ?? 0} total</Text>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="small" variant="secondary" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
