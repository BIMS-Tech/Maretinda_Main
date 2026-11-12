import { Button, Container, Heading, StatusBadge, Table, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { backendUrl, fetchQuery } from "../../lib/client/client"

type Invoice = { id: string; kind: "order" | "subscription"; number: string; total: string | number; issued_at: string }
type Cod = {
  id: string
  tracking_number: string | null
  delivered_at: string
  cod_amount: number
  state: "with_courier" | "to_pay_seller" | "paid"
  cod_paid_ref: string | null
}
type CodResult = { remittances: Cod[]; summary: Record<Cod["state"], { count: number; amount: number }> }

const peso = (n: number | string) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
const day = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const COD_STATES: Record<Cod["state"], { label: string; color: "orange" | "blue" | "green" }> = {
  with_courier: { label: "With the courier", color: "orange" },
  to_pay_seller: { label: "Maretinda to pay you", color: "blue" },
  paid: { label: "Paid to you", color: "green" },
}

/** Downloads need the seller's sign-in, so the PDF is fetched and saved rather than opened as a link. */
async function download(invoice: Invoice) {
  const token = window.localStorage.getItem("medusa_auth_token") || ""
  const res = await fetch(`${backendUrl}/vendor/invoices/${invoice.id}`, { headers: { authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error("Could not download this invoice")
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = `Invoice-${invoice.number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export const InvoicesPage = () => {
  const [kind, setKind] = useState<"order" | "subscription">("order")
  const invoices = useQuery({
    queryKey: ["vendor", "invoices", kind],
    queryFn: () => fetchQuery("/vendor/invoices", { method: "GET", query: { kind, limit: 100 } }) as Promise<{ invoices: Invoice[]; count: number }>,
  })
  const cod = useQuery({
    queryKey: ["vendor", "cod-remittances"],
    queryFn: () => fetchQuery("/vendor/cod-remittances", { method: "GET", query: { limit: 100 } }) as Promise<CodResult>,
  })

  const rows = invoices.data?.invoices ?? []
  const codRows = cod.data?.remittances ?? []

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0 divide-y">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Heading>Invoices</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {kind === "order"
                ? "Invoices issued in your shop's name for each order. Your buyer receives the same PDF by email."
                : "Invoices from Maretinda for your subscription payments."}
            </Text>
          </div>
          <div className="flex gap-2">
            <Button size="small" variant={kind === "order" ? "primary" : "secondary"} onClick={() => setKind("order")}>Orders</Button>
            <Button size="small" variant={kind === "subscription" ? "primary" : "secondary"} onClick={() => setKind("subscription")}>Subscription</Button>
          </div>
        </div>
        <div className="px-6 py-4">
          {invoices.isLoading ? (
            <Text className="text-ui-fg-subtle">Loading…</Text>
          ) : invoices.isError ? (
            <Text className="text-ui-fg-error">Could not load your invoices. Refresh to try again.</Text>
          ) : rows.length === 0 ? (
            <Text className="text-ui-fg-subtle">No invoices yet.</Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Number</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((i) => (
                  <Table.Row key={i.id}>
                    <Table.Cell>{i.number}</Table.Cell>
                    <Table.Cell>{day(i.issued_at)}</Table.Cell>
                    <Table.Cell className="text-right tabular-nums">{peso(i.total)}</Table.Cell>
                    <Table.Cell className="text-right">
                      <Button size="small" variant="secondary" onClick={() => download(i).catch((e) => toast.error(e.message))}>
                        Download PDF
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>

      <Container className="p-0 divide-y">
        <div className="px-6 py-4">
          <Heading level="h2">Cash on delivery</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Cash the courier collected from your buyers. The courier sends it to Maretinda, and Maretinda pays it to your bank account.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-3">
          {(Object.keys(COD_STATES) as Cod["state"][]).map((s) => (
            <div key={s} className="rounded-lg border border-ui-border-base p-3">
              <Text size="small" className="text-ui-fg-subtle">{COD_STATES[s].label}</Text>
              <Text weight="plus" size="large">{peso(cod.data?.summary?.[s]?.amount ?? 0)}</Text>
              <Text size="xsmall" className="text-ui-fg-muted">{cod.data?.summary?.[s]?.count ?? 0} parcels</Text>
            </div>
          ))}
        </div>
        <div className="px-6 py-4">
          {cod.isError ? (
            <Text className="text-ui-fg-error">Could not load your COD records. Refresh to try again.</Text>
          ) : codRows.length === 0 ? (
            <Text className="text-ui-fg-subtle">No delivered COD parcels yet.</Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Tracking</Table.HeaderCell>
                  <Table.HeaderCell>Delivered</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">COD amount</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Payment reference</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {codRows.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell>{r.tracking_number || "—"}</Table.Cell>
                    <Table.Cell>{day(r.delivered_at)}</Table.Cell>
                    <Table.Cell className="text-right tabular-nums">{peso(r.cod_amount)}</Table.Cell>
                    <Table.Cell><StatusBadge color={COD_STATES[r.state].color}>{COD_STATES[r.state].label}</StatusBadge></Table.Cell>
                    <Table.Cell>{r.cod_paid_ref || "—"}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>
    </div>
  )
}
