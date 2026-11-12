import { Button, Container, Heading, Select, Table, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { backendUrl, sdk } from "../../lib/client"

type Invoice = { id: string; kind: "order" | "subscription"; number: string; seller_id: string | null; total: string | number; issued_at: string }

const PAGE = 50
const peso = (n: number | string) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
const day = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

async function download(invoice: Invoice) {
  const token = localStorage.getItem("medusa_admin_jwt")
  const res = await fetch(`${backendUrl}/admin/invoices/${invoice.id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Could not download this invoice")
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = `Invoice-${invoice.number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/** Every invoice issued on the marketplace: sellers' order invoices and Maretinda's subscription invoices. */
export const InvoicesPage = () => {
  const [kind, setKind] = useState("all")
  const [page, setPage] = useState(0)
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "invoices", kind, page],
    queryFn: () =>
      sdk.client.fetch<{ invoices: Invoice[]; count: number }>("/admin/invoices", {
        method: "GET",
        query: { limit: PAGE, offset: page * PAGE, ...(kind !== "all" ? { kind } : {}) },
      }),
  })
  const rows = data?.invoices ?? []
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE))

  return (
    <Container className="p-0 divide-y">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>Invoices</Heading>
          <Text size="small" className="text-ui-fg-subtle">Order invoices are issued in each seller's name; subscription invoices by BIMS Technologies, Inc.</Text>
        </div>
        <div className="w-[200px]">
          <Select value={kind} onValueChange={(v) => { setPage(0); setKind(v) }}>
            <Select.Trigger aria-label="Invoice type"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All invoices</Select.Item>
              <Select.Item value="order">Orders</Select.Item>
              <Select.Item value="subscription">Subscriptions</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : rows.length === 0 ? (
          <Text className="text-ui-fg-subtle">No invoices yet.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Number</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((i) => (
                <Table.Row key={i.id}>
                  <Table.Cell>{i.number}</Table.Cell>
                  <Table.Cell>{i.kind === "order" ? "Order" : "Subscription"}</Table.Cell>
                  <Table.Cell>{day(i.issued_at)}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{peso(i.total)}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Button size="small" variant="secondary" onClick={() => download(i).catch(() => toast.error("Could not download this invoice"))}>
                      Download PDF
                    </Button>
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
