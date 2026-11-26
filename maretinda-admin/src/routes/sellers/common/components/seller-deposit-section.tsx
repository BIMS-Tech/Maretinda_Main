import { Button, Container, Heading, Input, Label, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { sdk } from "../../../../lib/client"

type Entry = { id: string; kind: "received" | "deducted" | "returned"; amount: string | number; reference: string | null; note: string | null; created_at: string }
type Owed = { id: string; label: string; amount: number; owed: number; created_at: string; order_id: string | null }
type Deposit = { balance: number; minimum: number; entries: Entry[]; owed: Owed[] }

const peso = (n: number | string) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
const day = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
const KIND = { received: "Received", deducted: "Used for refunds", returned: "Returned to shop" }

/**
 * What the shop owes from refunds (kept from its next payouts, then from the
 * deposit after 14 days) and its security deposit, which finance records here.
 */
export const SellerDepositSection = ({ sellerId }: { sellerId: string }) => {
  const qc = useQueryClient()
  const key = ["admin", "seller-deposit", sellerId]
  const { data, isPending, isError } = useQuery({
    queryKey: key,
    queryFn: () => sdk.client.fetch<Deposit>(`/admin/seller-deposits/${sellerId}`),
    retry: false,
  })
  const [kind, setKind] = useState<"received" | "returned">("received")
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const add = useMutation({
    mutationFn: () => sdk.client.fetch(`/admin/seller-deposits/${sellerId}`, { method: "POST", body: { kind, amount: Number(amount), reference } }),
    onSuccess: () => {
      toast.success("Recorded")
      setAmount("")
      setReference("")
      qc.invalidateQueries({ queryKey: key })
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const waive = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => sdk.client.fetch(`/admin/seller-charges/${id}/waive`, { method: "POST", body: { note } }),
    onSuccess: () => {
      toast.success("Waived")
      qc.invalidateQueries({ queryKey: key })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Finance-only: other roles get a 403 and the section stays hidden
  if (isPending || isError || !data) return null
  const owed = data.owed.reduce((n, c) => n + c.owed, 0)

  return (
    <Container className="mb-2 divide-y p-0" data-testid="seller-deposit">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Deposit and refund charges</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Refunds charged to the shop come off its next payouts; anything still owed after 14 days comes from the deposit.
          </Text>
        </div>
        <div className="text-right">
          <Text size="small" className="text-ui-fg-subtle">Deposit</Text>
          <Text weight="plus" className={data.minimum > 0 && data.balance < data.minimum ? "text-ui-fg-error" : ""}>{peso(data.balance)}</Text>
          {data.minimum > 0 && <Text size="xsmall" className="text-ui-fg-muted">Required {peso(data.minimum)}</Text>}
        </div>
      </div>
      <div className="px-6 py-4">
        <Text size="small" weight="plus" className="mb-2">Owed from refunds: {peso(owed)}</Text>
        {data.owed.length ? (
          <Table>
            <Table.Body>
              {data.owed.map((c) => (
                <Table.Row key={c.id}>
                  <Table.Cell>{c.label}</Table.Cell>
                  <Table.Cell>{day(c.created_at)}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">{peso(c.owed)} of {peso(c.amount)}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() => {
                        const note = window.prompt("Why is this waived? (e.g. courier claim paid)")
                        if (note?.trim()) waive.mutate({ id: c.id, note })
                      }}
                    >
                      Waive
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">Nothing owed.</Text>
        )}
      </div>
      <div className="flex flex-col gap-3 px-6 py-4">
        <Text size="small" weight="plus">Record a deposit transfer</Text>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <div>
            <Label size="small">Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content>
                <Select.Item value="received">Received from shop</Select.Item>
                <Select.Item value="returned">Returned to shop</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label size="small">Amount</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label size="small">Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button size="small" onClick={() => add.mutate()} isLoading={add.isPending} disabled={!amount || !reference.trim()}>
              Record
            </Button>
          </div>
        </div>
        {!!data.entries.length && (
          <div>
            {data.entries.slice(0, 10).map((e) => (
              <Text key={e.id} size="xsmall" className="text-ui-fg-subtle">
                {day(e.created_at)} · {KIND[e.kind]} {peso(e.amount)}{e.reference ? ` · ${e.reference}` : ""}{e.note ? ` · ${e.note}` : ""}
              </Text>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}
