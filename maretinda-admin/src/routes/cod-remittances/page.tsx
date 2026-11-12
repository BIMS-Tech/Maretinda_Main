import { Button, Container, Heading, Input, Select, StatusBadge, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type State = "with_courier" | "to_pay_seller" | "paid"

type Remittance = {
  id: string
  seller_name: string | null
  medusa_order_id: string | null
  provider: string
  tracking_number: string | null
  delivered_at: string
  cod_amount: number
  state: State
  cod_received_ref: string | null
  cod_paid_ref: string | null
}

type Result = {
  remittances: Remittance[]
  count: number
  summary: Record<State, { count: number; amount: number }>
}

const STATES: { value: State; label: string; color: "orange" | "blue" | "green" }[] = [
  { value: "with_courier", label: "With the courier", color: "orange" },
  { value: "to_pay_seller", label: "To pay the seller", color: "blue" },
  { value: "paid", label: "Paid to seller", color: "green" },
]

const peso = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n || 0)
const day = (d: string) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
const KEY = ["admin", "cod-remittances"]

/**
 * Cash a courier collected on delivery, by where it currently sits. The team
 * records it arriving from the courier, then records paying it to the seller.
 */
export const CodRemittancesPage = () => {
  const client = useQueryClient()
  const [state, setState] = useState<State>("with_courier")
  const [picked, setPicked] = useState<string[]>([])
  const [reference, setReference] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: [...KEY, state],
    queryFn: () => sdk.client.fetch<Result>("/admin/cod-remittances", { method: "GET", query: { state, limit: 200 } }),
  })

  const record = useMutation({
    mutationFn: (step: "received" | "paid") =>
      sdk.client.fetch<{ updated: number; skipped: number }>("/admin/cod-remittances", {
        method: "POST",
        body: { ids: picked, step, reference },
      }),
    onSuccess: ({ updated, skipped }) => {
      toast.success(`${updated} recorded${skipped ? `, ${skipped} skipped` : ""}`)
      setPicked([])
      setReference("")
      client.invalidateQueries({ queryKey: KEY })
    },
    onError: (e: any) => toast.error(e?.message || "Could not record that"),
  })

  const rows = data?.remittances ?? []
  const step = state === "with_courier" ? "received" : "paid"
  const pickedTotal = rows.filter((r) => picked.includes(r.id)).reduce((sum, r) => sum + r.cod_amount, 0)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <Container className="p-0 divide-y">
      <div className="px-6 py-4">
        <Heading>COD Remittances</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          Cash collected on delivery by couriers booked through Maretinda. Record it when the courier remits it, then when it is paid to the seller.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-3">
        {STATES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setState(s.value)
              setPicked([])
            }}
            className={`rounded-lg border p-3 text-left ${state === s.value ? "border-ui-border-interactive bg-ui-bg-subtle" : "border-ui-border-base"}`}
          >
            <Text size="small" className="text-ui-fg-subtle">{s.label}</Text>
            <Text weight="plus" size="large">{peso(data?.summary?.[s.value]?.amount ?? 0)}</Text>
            <Text size="xsmall" className="text-ui-fg-muted">{data?.summary?.[s.value]?.count ?? 0} parcels</Text>
          </button>
        ))}
      </div>

      {state !== "paid" && (
        <div className="flex flex-wrap items-end gap-3 px-6 py-4">
          <div className="min-w-[240px] flex-1">
            <Text size="small" weight="plus" className="mb-1">
              {step === "received" ? "Courier's remittance reference" : "Bank transfer reference"}
            </Text>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. FT-REMIT-2026-11-13" />
          </div>
          <Button
            disabled={!picked.length || !reference.trim()}
            isLoading={record.isPending}
            onClick={() => record.mutate(step)}
          >
            {step === "received" ? "Mark received from courier" : "Mark paid to seller"}
            {picked.length ? ` (${picked.length}, ${peso(pickedTotal)})` : ""}
          </Button>
        </div>
      )}

      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : rows.length === 0 ? (
          <Text className="text-ui-fg-subtle">Nothing here.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                {state !== "paid" && (
                  <Table.HeaderCell>
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={picked.length === rows.length}
                      onChange={(e) => setPicked(e.target.checked ? rows.map((r) => r.id) : [])}
                    />
                  </Table.HeaderCell>
                )}
                <Table.HeaderCell>Seller</Table.HeaderCell>
                <Table.HeaderCell>Tracking</Table.HeaderCell>
                <Table.HeaderCell>Delivered</Table.HeaderCell>
                <Table.HeaderCell className="text-right">COD amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Reference</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((r) => {
                const s = STATES.find((x) => x.value === r.state)!
                return (
                  <Table.Row key={r.id}>
                    {state !== "paid" && (
                      <Table.Cell>
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.tracking_number || r.id}`}
                          checked={picked.includes(r.id)}
                          onChange={() => toggle(r.id)}
                        />
                      </Table.Cell>
                    )}
                    <Table.Cell>{r.seller_name || "—"}</Table.Cell>
                    <Table.Cell>{r.tracking_number || "—"}</Table.Cell>
                    <Table.Cell>{day(r.delivered_at)}</Table.Cell>
                    <Table.Cell className="text-right tabular-nums">{peso(r.cod_amount)}</Table.Cell>
                    <Table.Cell><StatusBadge color={s.color}>{s.label}</StatusBadge></Table.Cell>
                    <Table.Cell>{r.cod_paid_ref || r.cod_received_ref || "—"}</Table.Cell>
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
