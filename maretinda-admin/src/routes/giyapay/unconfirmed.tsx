import { Button, Container, Heading, Input, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type Attempt = { id: string; cart_id: string; amount: number; email: string | null; method: string | null; created_at: string; attempts: number }

const KEY = ["admin", "giyapay", "unconfirmed"]
const peso = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n || 0)
const when = (d: string) =>
  new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

/**
 * Buyers who were sent to GiyaPay and never came back with a confirmation.
 * Most gave up; one that GiyaPay's dashboard shows as paid was charged and
 * has no order. Hidden when there is nothing to check.
 */
export const UnconfirmedPayments = () => {
  const client = useQueryClient()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: () => sdk.client.fetch<{ attempts: Attempt[] }>("/admin/giyapay/unconfirmed", { method: "GET" }),
  })
  const resolve = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch("/admin/giyapay/unconfirmed", { method: "POST", body: { id, note: notes[id] } }),
    onSuccess: () => {
      toast.success("Recorded")
      client.invalidateQueries({ queryKey: KEY })
    },
    onError: (e: any) => toast.error(e?.message || "Could not record that"),
  })

  const attempts = data?.attempts ?? []
  if (!attempts.length) return null

  return (
    <Container className="p-0 divide-y">
      <div className="px-6 py-4">
        <Heading level="h2">Payments to check ({attempts.length})</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          These buyers were sent to GiyaPay more than 30 minutes ago and no payment came back. Look each one up in GiyaPay by email, amount and time. If GiyaPay shows it paid, the buyer was charged without an order: contact them and refund or re-create the order.
        </Text>
      </div>
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Sent</Table.HeaderCell>
              <Table.HeaderCell>Buyer</Table.HeaderCell>
              <Table.HeaderCell>Method</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Amount</Table.HeaderCell>
              <Table.HeaderCell>What GiyaPay showed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {attempts.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell>{when(a.created_at)}{a.attempts > 1 ? ` · ${a.attempts} tries` : ""}</Table.Cell>
                <Table.Cell>{a.email || "—"}</Table.Cell>
                <Table.Cell>{a.method || "—"}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{peso(a.amount)}</Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Input
                      size="small"
                      aria-label={`Note for ${a.email || a.cart_id}`}
                      placeholder="e.g. Not paid, buyer left"
                      value={notes[a.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
                    />
                    <Button size="small" variant="secondary" disabled={!notes[a.id]?.trim()} onClick={() => resolve.mutate(a.id)}>
                      Done
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}
