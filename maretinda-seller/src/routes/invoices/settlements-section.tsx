import { Container, Heading, StatusBadge, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client/client"

type Hold = "no_order" | "not_delivered" | "holding" | "return_open" | "refunded" | null

type Pending = {
  reference_number: string
  order_id: string | null
  paid_at: string
  delivered_at: string | null
  release_at: string | null
  hold: Hold
  order_amount: number
  amount: number
  net_amount: number
}

type Paid = { reference_number: string; order_id: string | null; kind: string; gross_amount: number; net_amount: number; settled_at: string }

type Charge = { label: string; amount: number; owed: number; created_at: string }
type Recovery = { label: string; amount: number; source: "payout" | "deposit" | "cod"; created_at: string }

type Result = {
  hold_days: number
  summary: { ready: number; holding: number; awaiting_delivery: number; return_open: number; owed?: number; paid_total: number }
  charges?: Charge[]
  recovered?: Recovery[]
  deposit?: { balance: number; minimum: number }
  pending: Pending[]
  paid: Paid[]
}

const peso = (n: number | string) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
const day = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const FROM: Record<Recovery["source"], string> = {
  payout: "Kept from a payout",
  cod: "Kept from cash-on-delivery remittance",
  deposit: "Taken from your deposit",
}

/** Refund costs charged to the shop, how they are being recovered, and the deposit. */
const Charges = ({ data }: { data: Result }) => {
  const charges = data.charges ?? []
  const recovered = data.recovered ?? []
  const deposit = data.deposit
  if (!charges.length && !recovered.length && !(deposit && (deposit.minimum > 0 || deposit.balance > 0))) return null
  return (
    <div className="flex flex-col gap-3" data-testid="seller-charges">
      <div>
        <Text size="small" weight="plus">Charges from refunds</Text>
        <Text size="xsmall" className="text-ui-fg-subtle text-pretty">
          When a buyer is refunded for your fault after you were already paid (or for a return postage or processing fee that is
          yours to cover), the amount is kept from your next payouts. Anything still owed after 14 days comes from your security deposit.
        </Text>
      </div>
      {deposit && (deposit.minimum > 0 || deposit.balance > 0) && (
        <div className="rounded-lg border border-ui-border-base p-3">
          <Text size="small" className="text-ui-fg-subtle">Security deposit</Text>
          <Text weight="plus">{peso(deposit.balance)}</Text>
          {deposit.minimum > 0 && deposit.balance < deposit.minimum && (
            <Text size="xsmall" className="text-ui-fg-error">Below the required {peso(deposit.minimum)}. Top it up by contacting support@maretinda.com.</Text>
          )}
        </div>
      )}
      {!!charges.length && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Charge</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Amount</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Still owed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {charges.map((c, i) => (
              <Table.Row key={i}>
                <Table.Cell>{c.label}</Table.Cell>
                <Table.Cell>{day(c.created_at)}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{peso(c.amount)}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">{peso(c.owed)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {!!recovered.length && (
        <div>
          <Text size="xsmall" weight="plus" className="mb-1">Recovered so far</Text>
          {recovered.slice(0, 10).map((r, i) => (
            <Text key={i} size="xsmall" className="text-ui-fg-subtle">
              {day(r.created_at)} · {r.label}: {peso(r.amount)} ({FROM[r.source]})
            </Text>
          ))}
        </div>
      )}
    </div>
  )
}

const HOLDS: Record<Exclude<Hold, null> | "ready", { label: (r: Pending) => string; color: "grey" | "orange" | "blue" | "green" | "red" }> = {
  ready: { label: () => "In the next payout", color: "green" },
  holding: { label: (r) => `Paid from ${r.release_at ? day(r.release_at) : "—"}`, color: "blue" },
  not_delivered: { label: () => "Waiting for delivery", color: "grey" },
  return_open: { label: () => "Return being reviewed", color: "orange" },
  refunded: { label: () => "Refunded to the buyer", color: "red" },
  no_order: { label: () => "Being checked by Maretinda", color: "orange" },
}

/**
 * Money from the shop's online orders: what Maretinda is holding and until
 * when, what goes in the next bank transfer, and what has been paid.
 */
export const SettlementsSection = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor", "settlements"],
    queryFn: () => fetchQuery("/vendor/settlements", { method: "GET" }) as Promise<Result>,
  })

  const holdDays = data?.hold_days ?? 14
  const tiles = [
    { label: "In the next payout", value: data?.summary.ready },
    { label: `Held for ${holdDays} days after delivery`, value: data?.summary.holding },
    { label: "Waiting for delivery", value: data?.summary.awaiting_delivery },
    { label: "Paid to you", value: data?.summary.paid_total },
  ]
  const owed = data?.summary.owed ?? 0

  return (
    <Container className="p-0 divide-y">
      <div className="px-6 py-4">
        <Heading level="h2">Online payments</Heading>
        <Text size="small" className="text-ui-fg-subtle text-pretty">
          Each online payment and where it is now. An approved return comes off the amount; amounts are after the 2.5% payment
          processing fee and ₱5 per payment.
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 py-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-ui-border-base p-3">
            <Text size="small" className="text-ui-fg-subtle">{t.label}</Text>
            <Text weight="plus" size="large">{isLoading ? "…" : peso(t.value ?? 0)}</Text>
          </div>
        ))}
      </div>

      <div className="px-6 py-4">
        {isError ? (
          <Text className="text-ui-fg-error">Could not load your payouts. Refresh to try again.</Text>
        ) : isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : !data?.pending.length && !data?.paid.length && !data?.charges?.length ? (
          <Text className="text-ui-fg-subtle">No online payments yet.</Text>
        ) : (
          <div className="flex flex-col gap-6">
            {owed > 0 && (
              <Text size="small" className="text-ui-fg-error">
                {peso(owed)} from refunds will be kept from your next payout.
              </Text>
            )}
            <Charges data={data!} />
            {!!data?.pending.length && (
              <div>
                <Text size="small" weight="plus" className="mb-2">Not paid yet</Text>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Payment</Table.HeaderCell>
                      <Table.HeaderCell>Paid by buyer</Table.HeaderCell>
                      <Table.HeaderCell>Delivered</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Order</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">You receive</Table.HeaderCell>
                      <Table.HeaderCell>Status</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.pending.map((r) => {
                      const h = HOLDS[r.hold ?? "ready"]
                      return (
                        <Table.Row key={r.reference_number}>
                          <Table.Cell className="font-mono text-xs">{r.reference_number}</Table.Cell>
                          <Table.Cell>{day(r.paid_at)}</Table.Cell>
                          <Table.Cell>{r.delivered_at ? day(r.delivered_at) : "—"}</Table.Cell>
                          <Table.Cell className="text-right tabular-nums">
                            {peso(r.order_amount)}
                            {r.amount !== r.order_amount && (
                              <Text size="xsmall" className="text-ui-fg-muted">{peso(r.order_amount - r.amount)} returned</Text>
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-right tabular-nums">{peso(r.net_amount)}</Table.Cell>
                          <Table.Cell><StatusBadge color={h.color}>{h.label(r)}</StatusBadge></Table.Cell>
                        </Table.Row>
                      )
                    })}
                  </Table.Body>
                </Table>
              </div>
            )}
            {!!data?.paid.length && (
              <div>
                <Text size="small" weight="plus" className="mb-2">Paid</Text>
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Payment</Table.HeaderCell>
                      <Table.HeaderCell>Sent to your bank</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Order</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Paid to you</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {data.paid.map((r) => (
                      <Table.Row key={`${r.reference_number}-${r.settled_at}`}>
                        <Table.Cell className="font-mono text-xs">{r.reference_number}</Table.Cell>
                        <Table.Cell>{day(r.settled_at)}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">{peso(r.gross_amount)}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums">{peso(r.net_amount)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}
