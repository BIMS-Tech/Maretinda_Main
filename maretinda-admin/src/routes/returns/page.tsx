import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, Table, Tabs, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { api, CaseDetail, CaseRow, Cancellation, day, Evidence, Line, PAYOUT_METHODS, peso, privateFile, Refund, uploadReceipt, when } from "./api"

const STAGE_COLOR: Record<string, "orange" | "red" | "blue" | "green" | "grey" | "purple"> = {
  escalated: "red",
  refund_due: "orange",
  seller_review: "blue",
  declined: "purple",
  awaiting_return: "blue",
  in_transit: "blue",
  inspecting: "blue",
  refunded: "green",
  closed: "grey",
  withdrawn: "grey",
}

const Lines = ({ title, lines }: { title: string; lines: Line[] }) =>
  lines.length ? (
    <div>
      <Text size="xsmall" weight="plus">{title}</Text>
      {lines.map((l, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-ui-fg-subtle">{l.label}</span>
          <span className="tabular-nums">{peso(l.amount)}</span>
        </div>
      ))}
    </div>
  ) : null

const PayoutDetails = ({ refund, payout }: { refund?: Refund | null; payout: CaseDetail["payout"] }) =>
  payout ? (
    <div className="bg-ui-bg-subtle rounded-md p-3" data-testid="refund-account">
      <Text size="xsmall" className="text-ui-fg-muted">Send the refund to</Text>
      <Text size="small" weight="plus">{PAYOUT_METHODS[payout.method]}{payout.bank_name ? `: ${payout.bank_name}` : ""}</Text>
      <Text size="small" className="font-mono">{payout.account_number}</Text>
      <Text size="small">{payout.account_name}</Text>
      {refund?.business_days && <Text size="xsmall" className="text-ui-fg-muted mt-1">Policy: within {refund.business_days} business days.</Text>}
    </div>
  ) : (
    <Text size="small" className="text-ui-fg-error">No refund account on file. Ask the buyer for one.</Text>
  )

const EvidenceItem = ({ item }: { item: Evidence }) => {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url = ""
    privateFile(`/admin/return-evidence/${item.id}`).then((u) => setSrc((url = u))).catch(() => setSrc(""))
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [item.id])
  if (src === null) return <div className="bg-ui-bg-subtle h-24 w-32 animate-pulse rounded-md" />
  if (!src) return <Text size="xsmall" className="text-ui-fg-muted">Couldn't load</Text>
  return item.kind === "video" ? (
    <video src={src} controls className="h-40 max-w-full rounded-md border" />
  ) : (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt="" className="h-24 rounded-md border object-cover" />
    </a>
  )
}

/** An escalated return: both sides' proof, then the binding decision. */
const DecideForm = ({ c, done }: { c: CaseDetail; done: () => void }) => {
  const qc = useQueryClient()
  const [decision, setDecision] = useState<"refund" | "reject">("refund")
  const [fault, setFault] = useState("seller")
  const [resolution, setResolution] = useState(c.received_at ? "refund_only" : "return_refund")
  const [note, setNote] = useState("")
  const decide = useMutation({
    mutationFn: () => api(`/admin/return-cases/${c.request_id}/decide`, { decision, fault, resolution, note }),
    onSuccess: () => {
      toast.success("Decided. The buyer and the shop have been emailed.")
      qc.invalidateQueries({ queryKey: ["admin", "returns"] })
      done()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return (
    <div className="border-ui-border-base flex flex-col gap-3 rounded-md border p-3" data-testid="decide-form">
      <Text size="small" weight="plus">Decide by {when(c.decide_by)}</Text>
      <div className="grid grid-cols-2 gap-2">
        <Button size="small" variant={decision === "refund" ? "primary" : "secondary"} onClick={() => setDecision("refund")}>Refund the buyer</Button>
        <Button size="small" variant={decision === "reject" ? "danger" : "secondary"} onClick={() => setDecision("reject")}>Reject the claim</Button>
      </div>
      {decision === "refund" && (
        <>
          <div>
            <Label size="small">Whose fault</Label>
            <Select value={fault} onValueChange={setFault}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="seller">The shop (wrong, damaged, not as described): shop pays return postage and fee</Select.Item>
                <Select.Item value="courier">The courier (lost or damaged in transit): claim from the courier</Select.Item>
                <Select.Item value="buyer">The buyer (shop's exception): fees come off the refund</Select.Item>
              </Select.Content>
            </Select>
          </div>
          {!c.received_at && (
            <div>
              <Label size="small">The item</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Content>
                  <Select.Item value="return_refund">Buyer sends it back first</Select.Item>
                  <Select.Item value="refund_only">Refund without a return</Select.Item>
                </Select.Content>
              </Select>
            </div>
          )}
        </>
      )}
      <div>
        <Label size="small">Reason (both sides see this)</Label>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button size="small" onClick={() => decide.mutate()} isLoading={decide.isPending} disabled={!note.trim()}>
        Send decision
      </Button>
    </div>
  )
}

const CaseDrawer = ({ id, close }: { id: string; close: () => void }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns", "case", id],
    queryFn: () => api<{ return_case: CaseDetail }>(`/admin/return-cases/${id}`),
  })
  const c = data?.return_case
  return (
    <Drawer open onOpenChange={(o) => !o && close()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Return on order #{c?.order_number ?? ""}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4 overflow-y-auto">
          {isLoading || !c ? (
            <Text>Loading…</Text>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge color={STAGE_COLOR[c.stage] ?? "grey"}>{c.stage_label}</Badge>
                <Badge color="grey">{c.payment === "online" ? "Paid online" : "Cash on delivery"}</Badge>
                {c.fault && <Badge color="grey">Fault: {c.fault}</Badge>}
                <Link to={`/orders/${c.order_id}`} className="text-ui-fg-interactive text-sm">Open order</Link>
              </div>
              <Text size="small">Shop: {c.seller?.name ?? "—"} · Opened {when(c.created_at)}</Text>
              <div className="flex flex-col gap-2">
                {c.items.map((i, n) => (
                  <Text key={n} size="small">
                    {i.quantity} × {i.title}{i.variant_title ? ` (${i.variant_title})` : ""}, {peso(i.unit_price)} each: {i.reason ?? "—"}
                  </Text>
                ))}
              </div>
              {c.buyer_note && <Text size="small" className="text-ui-fg-subtle">Buyer: “{c.buyer_note}”</Text>}
              {c.evidence.length > 0 && (
                <div>
                  <Text size="small" weight="plus" className="mb-1">Buyer's proof</Text>
                  <div className="flex flex-wrap gap-2">{c.evidence.map((e) => <EvidenceItem key={e.id} item={e} />)}</div>
                </div>
              )}
              {c.seller_note && <Text size="small" className="text-ui-fg-subtle">Shop: “{c.seller_note}”</Text>}
              {c.seller_evidence.length > 0 && (
                <div>
                  <Text size="small" weight="plus" className="mb-1">Shop's proof</Text>
                  <div className="flex flex-wrap gap-2">{c.seller_evidence.map((e) => <EvidenceItem key={e.id} item={e} />)}</div>
                </div>
              )}
              {c.return_tracking && (
                <Text size="small">
                  Sent back with {c.return_courier}, {c.return_tracking}
                  {c.return_shipping ? ` (postage ${peso(c.return_shipping)})` : ""} on {day(c.shipped_back_at)}
                  {c.received_at ? `; received ${day(c.received_at)}` : ""}
                </Text>
              )}
              {c.decision_note && <Text size="small">Decision: {c.decision_note}</Text>}
              {c.stage === "escalated" && <DecideForm c={c} done={close} />}
              {c.refund && (
                <div className="flex flex-col gap-2">
                  <Text size="small" weight="plus">Refund {peso(c.refund.amount)}: {c.refund.status === "paid" ? `sent ${day(c.refund.paid_at)}, ref ${c.refund.reference}` : `due by ${day(c.refund.due_by)}`}</Text>
                  <Lines title="Refunded" lines={c.refund.refunded} />
                  <Lines title="Taken off" lines={c.refund.deductions} />
                  <Lines title="Charged to the shop" lines={c.refund.seller_charges} />
                </div>
              )}
              <PayoutDetails refund={c.refund} payout={c.payout} />
            </>
          )}
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const ReturnsTab = () => {
  const [stage, setStage] = useState("all")
  const [open, setOpen] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns", "cases", stage],
    queryFn: () => api<{ return_cases: CaseRow[] }>(`/admin/return-cases${stage === "all" ? "" : `?stage=${stage}`}`),
  })
  const rows = data?.return_cases ?? []
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Text size="small" className="text-ui-fg-subtle">
          Escalated returns come first: decide within 7 days. Shops answer within 48 hours or it's approved for the buyer.
        </Text>
        <div className="w-48">
          <Select value={stage} onValueChange={setStage}>
            <Select.Trigger><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              <Select.Item value="escalated">Waiting for Maretinda</Select.Item>
              <Select.Item value="seller_review">Waiting for the shop</Select.Item>
              <Select.Item value="declined">Shop disputed</Select.Item>
              <Select.Item value="awaiting_return">Item to be sent back</Select.Item>
              <Select.Item value="inspecting">Shop checking item</Select.Item>
              <Select.Item value="refund_due">Refund to send</Select.Item>
              <Select.Item value="refunded">Refunded</Select.Item>
              <Select.Item value="closed">Closed</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <Text>Loading…</Text>
      ) : !rows.length ? (
        <Text className="text-ui-fg-subtle">No returns here.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Buyer</Table.HeaderCell>
              <Table.HeaderCell>Shop</Table.HeaderCell>
              <Table.HeaderCell>Stage</Table.HeaderCell>
              <Table.HeaderCell>Next deadline</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.request_id} className="cursor-pointer" onClick={() => setOpen(r.request_id)}>
                <Table.Cell>#{r.display_id}</Table.Cell>
                <Table.Cell>{[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email}</Table.Cell>
                <Table.Cell>{r.seller_name}</Table.Cell>
                <Table.Cell><Badge size="2xsmall" color={STAGE_COLOR[r.stage] ?? "grey"}>{r.stage_label}</Badge></Table.Cell>
                <Table.Cell>{r.stage === "escalated" ? when(r.decide_by) : r.stage === "seller_review" ? when(r.respond_by) : "—"}</Table.Cell>
                <Table.Cell className="text-right"><Button size="small" variant="transparent">Open</Button></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {open && <CaseDrawer id={open} close={() => setOpen(null)} />}
    </div>
  )
}

/** Accounting logs a transfer: reference, method, exact amount, date and the receipt. */
const PaidDrawer = ({ refund, close }: { refund: Refund; close: () => void }) => {
  const qc = useQueryClient()
  const [reference, setReference] = useState("")
  const [method, setMethod] = useState(refund.payout?.method === "bank" ? "instapay" : refund.payout?.method ?? "instapay")
  const [amount, setAmount] = useState(String(refund.amount))
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [receipt, setReceipt] = useState<{ id: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const paid = useMutation({
    mutationFn: () => api(`/admin/refunds/${refund.id}/paid`, { reference, method, amount: Number(amount), paid_at: paidAt, receipt_id: receipt?.id }),
    onSuccess: () => {
      toast.success("Logged. The buyer has been emailed the reference and receipt.")
      qc.invalidateQueries({ queryKey: ["admin", "returns"] })
      close()
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const differs = Math.abs(Number(amount) - refund.amount) >= 0.01
  return (
    <Drawer open onOpenChange={(o) => !o && close()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Mark refund as sent</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4 overflow-y-auto">
          <Text size="small">Order #{refund.display_id} · {refund.buyer} · due {peso(refund.amount)}</Text>
          <PayoutDetails refund={refund} payout={refund.payout} />
          <div>
            <Label size="small">Sent by</Label>
            <Select value={method} onValueChange={setMethod}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="instapay">InstaPay</Select.Item>
                <Select.Item value="gcash">GCash</Select.Item>
                <Select.Item value="maya">Maya</Select.Item>
                <Select.Item value="bank_transfer">Bank transfer</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label size="small" htmlFor="refund-reference">Reference number</Label>
            <Input id="refund-reference" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label size="small" htmlFor="refund-amount">Exact amount sent</Label>
              <Input id="refund-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label size="small" htmlFor="refund-date">Date sent</Label>
              <Input id="refund-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
          </div>
          {differs && <Text size="xsmall" className="text-ui-fg-error">This differs from the {peso(refund.amount)} due. The buyer sees the amount you enter.</Text>}
          <div>
            <Label size="small" htmlFor="refund-receipt">Transfer receipt</Label>
            <input
              id="refund-receipt"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="text-sm"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setUploading(true)
                try {
                  setReceipt({ id: await uploadReceipt(f), name: f.name })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed")
                }
                setUploading(false)
              }}
            />
            {uploading && <Text size="xsmall">Uploading…</Text>}
            {receipt && <Text size="xsmall" className="text-ui-fg-subtle">{receipt.name} attached</Text>}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button size="small" variant="secondary" onClick={close}>Cancel</Button>
          <Button size="small" onClick={() => paid.mutate()} isLoading={paid.isPending} disabled={!reference.trim() || uploading}>
            Log as sent
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const KIND: Record<Refund["kind"], string> = { return: "Return", cancellation: "Cancellation", failed_delivery: "Failed delivery" }

const RefundsTab = ({ status }: { status: "due" | "paid" }) => {
  const [paying, setPaying] = useState<Refund | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns", "refunds", status],
    queryFn: () => api<{ refunds: Refund[] }>(`/admin/refunds?status=${status}`),
  })
  const rows = data?.refunds ?? []
  const late = (r: Refund) => status === "due" && r.due_by && new Date(r.due_by) < new Date()
  return (
    <div className="flex flex-col gap-3">
      <Text size="small" className="text-ui-fg-subtle">
        {status === "due"
          ? "Send each refund by hand to the buyer's account, then log it with the reference and receipt. Online payments: 7–14 business days; cash on delivery: 3–5."
          : "Refunds already sent. The buyer sees the reference, date, amount and receipt on their order."}
      </Text>
      {isLoading ? (
        <Text>Loading…</Text>
      ) : !rows.length ? (
        <Text className="text-ui-fg-subtle">{status === "due" ? "No refunds waiting." : "None yet."}</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Why</Table.HeaderCell>
              <Table.HeaderCell>Buyer</Table.HeaderCell>
              <Table.HeaderCell>Account</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Amount</Table.HeaderCell>
              <Table.HeaderCell>{status === "due" ? "Due by" : "Sent"}</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell><Link to={`/orders/${r.order_id}`} className="text-ui-fg-interactive">#{r.display_id}</Link></Table.Cell>
                <Table.Cell>{KIND[r.kind]}</Table.Cell>
                <Table.Cell>{r.buyer}</Table.Cell>
                <Table.Cell>{r.payout_label ?? <span className="text-ui-fg-error">Missing</span>}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{peso(status === "paid" ? r.paid_amount : r.amount)}</Table.Cell>
                <Table.Cell className={late(r) ? "text-ui-fg-error" : ""}>{status === "due" ? day(r.due_by) : `${day(r.paid_at)} · ${r.reference}`}</Table.Cell>
                <Table.Cell className="text-right">
                  {status === "due" ? (
                    <Button size="small" variant="secondary" onClick={() => setPaying(r)} disabled={!r.payout}>Mark as sent</Button>
                  ) : r.has_receipt ? (
                    <Button size="small" variant="transparent" onClick={() => privateFile(`/admin/refunds/${r.id}/receipt`).then((u) => window.open(u, "_blank")).catch((e) => toast.error(e.message))}>
                      Receipt
                    </Button>
                  ) : null}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {paying && <PaidDrawer refund={paying} close={() => setPaying(null)} />}
    </div>
  )
}

const CancellationsTab = () => {
  const qc = useQueryClient()
  const [status, setStatus] = useState("pending")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "returns", "cancellations", status],
    queryFn: () => api<{ cancellation_requests: Cancellation[] }>(`/admin/cancellation-requests?status=${status}`),
  })
  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      api(`/admin/cancellation-requests/${id}`, { decision, note: notes[id] ?? "" }),
    onSuccess: (_d, v) => {
      toast.success(v.decision === "approve" ? "Cancelled. The refund is in Refunds to send." : "Rejected. The buyer has been emailed.")
      qc.invalidateQueries({ queryKey: ["admin", "returns"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const rows = data?.cancellation_requests ?? []
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Text size="small" className="text-ui-fg-subtle">
          Buyers asking to cancel paid-online orders before they ship. Approving cancels the order; the refund is what was paid less the processing fee.
        </Text>
        <div className="w-40">
          <Select value={status} onValueChange={setStatus}>
            <Select.Trigger><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="pending">Waiting</Select.Item>
              <Select.Item value="approved">Approved</Select.Item>
              <Select.Item value="rejected">Rejected</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <Text>Loading…</Text>
      ) : !rows.length ? (
        <Text className="text-ui-fg-subtle">Nothing here.</Text>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="border-ui-border-base flex flex-col gap-2 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Text size="small" weight="plus">
                <Link to={`/orders/${r.order_id}`} className="text-ui-fg-interactive">Order #{r.display_id}</Link> · {[r.first_name, r.last_name].filter(Boolean).join(" ") || r.email} · {r.seller_name}
              </Text>
              <Text size="xsmall" className="text-ui-fg-muted">{when(r.created_at)}</Text>
            </div>
            <Text size="small">“{r.reason}”</Text>
            <Text size="xsmall" className="text-ui-fg-subtle">Refund to {r.payout_label ?? "—"}</Text>
            {r.decision_note && <Text size="xsmall">Note: {r.decision_note}</Text>}
            {r.status === "pending" && (
              <div className="flex flex-col gap-2">
                <Input placeholder="Note for the buyer (needed to reject)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="small" onClick={() => decide.mutate({ id: r.id, decision: "approve" })} isLoading={decide.isPending && decide.variables?.id === r.id}>Cancel the order</Button>
                  <Button size="small" variant="secondary" onClick={() => decide.mutate({ id: r.id, decision: "reject" })}>Reject</Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

/**
 * Returns, refunds and cancellations, per the return and refund policy:
 * escalated returns to decide, refunds accounting has to send by hand, and
 * buyers' requests to cancel paid orders.
 */
export const ReturnsPage = () => {
  const counts = useQuery({
    queryKey: ["admin", "returns", "counts"],
    queryFn: async () => {
      const [esc, due, cxl] = await Promise.all([
        api<{ return_cases: CaseRow[] }>("/admin/return-cases?stage=escalated"),
        api<{ refunds: Refund[] }>("/admin/refunds?status=due"),
        api<{ cancellation_requests: Cancellation[] }>("/admin/cancellation-requests?status=pending"),
      ])
      return { escalated: esc.return_cases.length, due: due.refunds.length, cancel: cxl.cancellation_requests.length }
    },
  })
  const n = (k: "escalated" | "due" | "cancel") => (counts.data?.[k] ? ` (${counts.data[k]})` : "")
  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Returns &amp; Refunds</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Policy and steps are on the storefront at /returns-policy. Shops see every case in their Requests; buyers on their order.
        </Text>
      </div>
      <Tabs defaultValue="returns" className="px-6 pb-6">
        <Tabs.List>
          <Tabs.Trigger value="returns">Returns{n("escalated")}</Tabs.Trigger>
          <Tabs.Trigger value="due">Refunds to send{n("due")}</Tabs.Trigger>
          <Tabs.Trigger value="paid">Refunds sent</Tabs.Trigger>
          <Tabs.Trigger value="cancel">Cancellations{n("cancel")}</Tabs.Trigger>
        </Tabs.List>
        <div className="pt-4">
          <Tabs.Content value="returns"><ReturnsTab /></Tabs.Content>
          <Tabs.Content value="due"><RefundsTab status="due" /></Tabs.Content>
          <Tabs.Content value="paid"><RefundsTab status="paid" /></Tabs.Content>
          <Tabs.Content value="cancel"><CancellationsTab /></Tabs.Content>
        </div>
      </Tabs>
    </Container>
  )
}
