import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { backendUrl, sdk } from "../../lib/client"

type Invoice = {
  id: string
  kind: "order" | "subscription" | "fees" | "credit"
  document: "invoice" | "statement" | "summary" | "credit_note" | "adjustment"
  official: boolean
  number: string
  corrects_id: string | null
  seller_id: string | null
  total: string | number
  issued_at: string
}

const PAGE = 50
const peso = (n: number | string) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
const day = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const DOCUMENTS: Record<Invoice["document"], { label: string; file: string }> = {
  invoice: { label: "Invoice", file: "Invoice" },
  statement: { label: "Billing statement", file: "Billing-statement" },
  summary: { label: "Order summary", file: "Order-summary" },
  credit_note: { label: "Credit note", file: "Credit-note" },
  adjustment: { label: "Billing adjustment", file: "Billing-adjustment" },
}

const KINDS: Record<Invoice["kind"], string> = {
  order: "Seller's order",
  subscription: "Plan payment",
  fees: "Payout fees",
  credit: "Correction",
}

/** Downloads need the admin's sign-in, so the file is fetched and saved rather than opened as a link. */
async function download(invoice: Invoice, format: "pdf" | "json") {
  const token = localStorage.getItem("medusa_admin_jwt")
  const res = await fetch(`${backendUrl}/admin/invoices/${invoice.id}${format === "json" ? "?format=json" : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Could not download this document")
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = format === "json" ? `${invoice.number}.json` : `${DOCUMENTS[invoice.document]?.file ?? "Invoice"}-${invoice.number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/** Reduce an issued platform document. It can't be edited or deleted, only credited. */
const CreditDrawer = ({ invoice, close }: { invoice: Invoice; close: () => void }) => {
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const qc = useQueryClient()
  const credit = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ invoice: { number: string } }>(`/admin/invoices/${invoice.id}/credit-notes`, {
        method: "POST",
        body: { amount: Number(amount), reason },
      }),
    onSuccess: ({ invoice: made }) => {
      toast.success(`${made.number} issued and emailed to the shop.`)
      qc.invalidateQueries({ queryKey: ["admin", "invoices"] })
      close()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Drawer open onOpenChange={(open) => !open && close()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Credit {invoice.number}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4">
          <Text size="small" className="text-ui-fg-subtle">
            An issued document can't be changed or deleted. To reduce it, issue a{" "}
            {invoice.official ? "credit note" : "billing adjustment"} that points at it. The shop is emailed a copy.
          </Text>
          <div>
            <Label size="small" weight="plus" htmlFor="credit-amount">
              Amount to credit (₱), up to {peso(invoice.total)}
            </Label>
            <Input id="credit-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label size="small" weight="plus" htmlFor="credit-reason">
              Reason, printed on the document
            </Label>
            <Textarea
              id="credit-reason"
              rows={3}
              placeholder="Return, allowance, discount or overbilling, with a short explanation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button isLoading={credit.isPending} disabled={!amount || !reason.trim()} onClick={() => credit.mutate()}>
            Issue
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

/**
 * Every document issued on the marketplace: sellers' order documents, and the
 * platform's to sellers (plan payments, monthly payout fees, corrections).
 */
export const InvoicesPage = () => {
  const [kind, setKind] = useState("all")
  const [page, setPage] = useState(0)
  const [crediting, setCrediting] = useState<Invoice | null>(null)
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
        <div className="max-w-2xl">
          <Heading>Invoices</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Order documents are in each seller's name; plan payments, payout fees and corrections are from BIMS Technologies Inc.
            Documents marked "Not official" were issued before the BIR Permit to Issue (PTI) was set, and say so on the page.
          </Text>
        </div>
        <div className="w-[200px]">
          <Select value={kind} onValueChange={(v) => { setPage(0); setKind(v) }}>
            <Select.Trigger aria-label="Document type"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All documents</Select.Item>
              <Select.Item value="order">Sellers' orders</Select.Item>
              <Select.Item value="subscription">Plan payments</Select.Item>
              <Select.Item value="fees">Payout fees</Select.Item>
              <Select.Item value="credit">Corrections</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : rows.length === 0 ? (
          <Text className="text-ui-fg-subtle">Nothing issued yet.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Number</Table.HeaderCell>
                <Table.HeaderCell>Document</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((i) => (
                <Table.Row key={i.id}>
                  <Table.Cell>{i.number}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <span>{DOCUMENTS[i.document]?.label ?? "Invoice"}</span>
                      <span className="text-ui-fg-muted">· {KINDS[i.kind]}</span>
                      {!i.official && <Badge size="2xsmall" color="grey">Not official</Badge>}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{day(i.issued_at)}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{i.kind === "credit" ? `− ${peso(i.total)}` : peso(i.total)}</Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="small" variant="secondary" onClick={() => download(i, "pdf").catch((e) => toast.error(e.message))}>
                        PDF
                      </Button>
                      <Button size="small" variant="transparent" onClick={() => download(i, "json").catch((e) => toast.error(e.message))}>
                        Data
                      </Button>
                      {i.kind !== "order" && i.kind !== "credit" && (
                        <Button size="small" variant="transparent" onClick={() => setCrediting(i)}>
                          Credit
                        </Button>
                      )}
                    </div>
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
      {crediting && <CreditDrawer invoice={crediting} close={() => setCrediting(null)} />}
    </Container>
  )
}
