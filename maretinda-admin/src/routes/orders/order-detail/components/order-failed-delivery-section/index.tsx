import { Button, Container, Heading, Input, Label, Text, toast, usePrompt } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"

import { sdk } from "../../../../../lib/client"

/**
 * The courier brought the parcel back because of the buyer (wrong address,
 * unreachable, refused). A prepaid order is refunded less shipping, the
 * courier's return fee and the processing fee; repeat COD failures lose COD.
 */
export const OrderFailedDeliverySection = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const prompt = usePrompt()
  const [open, setOpen] = useState(false)
  const [fee, setFee] = useState("")
  const [done, setDone] = useState(false)
  const record = useMutation({
    mutationFn: () => sdk.client.fetch<{ refund: string | null }>(`/admin/orders/${order.id}/failed-delivery`, { method: "POST", body: { rts_fee: fee === "" ? 0 : Number(fee) } }),
    onSuccess: (r) => {
      setDone(true)
      toast.success(r.refund ? "Recorded. The refund is in Returns & Refunds → Refunds to send." : "Recorded. No refund is due (cash on delivery).")
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const shipped = (order.fulfillments ?? []).some((f: any) => f.shipped_at)
  if (!shipped || order.status === "canceled") return null

  return (
    <Container className="flex flex-col gap-3 px-6 py-4" data-testid="failed-delivery">
      <Heading level="h2">Failed delivery</Heading>
      {done ? (
        <Text size="small">Recorded.</Text>
      ) : !open ? (
        <>
          <Text size="small" className="text-ui-fg-subtle">Use when the courier returned the parcel because of the buyer: wrong address, unreachable, or refused.</Text>
          <Button size="small" variant="secondary" onClick={() => setOpen(true)}>Record failed delivery</Button>
        </>
      ) : (
        <>
          <div>
            <Label size="small">Courier's return-to-sender fee (₱)</Label>
            <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" />
          </div>
          <Button
            size="small"
            isLoading={record.isPending}
            onClick={async () => {
              const ok = await prompt({
                title: "Record a failed delivery?",
                description: "A paid-online order gets a refund less shipping, this fee and the processing fee. A cash-on-delivery buyer with repeated failures can no longer choose cash on delivery.",
                confirmText: "Record",
                cancelText: "Cancel",
              })
              if (ok) record.mutate()
            }}
          >
            Record
          </Button>
        </>
      )}
    </Container>
  )
}
