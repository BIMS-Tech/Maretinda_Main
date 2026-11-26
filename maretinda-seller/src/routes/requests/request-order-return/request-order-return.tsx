import { Badge, Button, Heading, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { HowTo } from "../../../components/common/how-to"
import { RouteDrawer } from "../../../components/modals"
import {
  evidenceUrl,
  ReturnCase,
  uploadReturnProof,
  useRespondToReturn,
  useReturnCase,
  useReturnReceived,
} from "../../../hooks/api/return-cases"

const peso = (n: number | null | undefined) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(n) || 0)
const when = (d: string | null) =>
  d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""

/** A photo or video the buyer (or the shop) attached, loaded with the seller's sign-in. */
const Evidence = ({ item }: { item: { id: string; kind: "photo" | "video" } }) => {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let url: string | null = null
    evidenceUrl(item.id).then((u) => setSrc((url = u))).catch(() => setSrc(""))
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [item.id])
  if (src === null) return <div className="bg-ui-bg-subtle h-28 w-36 animate-pulse rounded-md" />
  if (!src) return <Text size="xsmall" className="text-ui-fg-muted">Couldn't load</Text>
  return item.kind === "video" ? (
    <video src={src} controls className="h-40 max-w-full rounded-md border" />
  ) : (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt="Buyer's photo" className="h-28 rounded-md border object-cover" />
    </a>
  )
}

/** Upload one or more files as proof; returns the ids. */
const ProofPicker = ({ value, onChange }: { value: { id: string; name: string }[]; onChange: (v: { id: string; name: string }[]) => void }) => {
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <label className="border-ui-border-base text-ui-fg-interactive cursor-pointer rounded-md border border-dashed px-3 py-3 text-center text-sm">
        <input
          type="file"
          className="sr-only"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ""
            setBusy(true)
            const added: { id: string; name: string }[] = []
            for (const f of files) {
              try {
                added.push(await uploadReturnProof(f))
              } catch (err) {
                toast.error(`${f.name}: ${err instanceof Error ? err.message : "upload failed"}`)
              }
            }
            setBusy(false)
            onChange([...value, ...added])
          }}
        />
        {busy ? "Uploading…" : "Add packing photos or video, or the courier's handover record"}
      </label>
      {value.map((v) => (
        <Text key={v.id} size="xsmall" className="text-ui-fg-subtle">
          {v.name}
        </Text>
      ))}
    </div>
  )
}

const Answer = ({ c }: { c: ReturnCase }) => {
  const respond = useRespondToReturn(c.request_id)
  const [mode, setMode] = useState<"" | "accept_return" | "refund_only" | "dispute">("")
  const [note, setNote] = useState("")
  const [instructions, setInstructions] = useState("")
  const [proof, setProof] = useState<{ id: string; name: string }[]>([])
  const lost = c.reasons.every((r) => r.code === "not-received")

  const send = async () => {
    try {
      await respond.mutateAsync({ action: mode as any, note: note || undefined, instructions: instructions || undefined, evidence: proof.map((p) => p.id) })
      toast.success("Answer sent. The buyer has been emailed.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send. Try again.")
    }
  }

  return (
    <div className="flex flex-col gap-3" data-testid="return-answer">
      <Text size="small" weight="plus">
        Answer by {when(c.respond_by)}. With no answer it is approved automatically.
      </Text>
      <div className="grid grid-cols-1 gap-2">
        {!lost && (
          <Button variant={mode === "accept_return" ? "primary" : "secondary"} size="small" onClick={() => setMode("accept_return")}>
            Take it back, then refund
          </Button>
        )}
        <Button variant={mode === "refund_only" ? "primary" : "secondary"} size="small" onClick={() => setMode("refund_only")}>
          Refund without a return
        </Button>
        <Button variant={mode === "dispute" ? "danger" : "secondary"} size="small" onClick={() => setMode("dispute")}>
          Dispute the claim
        </Button>
      </div>
      {mode === "accept_return" && (
        <div>
          <Label size="small">Instructions for sending it back (optional)</Label>
          <Textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Use J&T, write the order number on the parcel" />
          <Text size="xsmall" className="text-ui-fg-muted mt-1">The buyer sends it to your pickup address within 5 days. Return postage is refunded to them and charged to you if it was your fault.</Text>
        </div>
      )}
      {mode === "refund_only" && (
        <Text size="small" className="text-ui-fg-subtle">Good for low-value or badly broken items: no return shipping to pay. The refund comes off your payout for this order.</Text>
      )}
      {mode === "dispute" && (
        <div className="flex flex-col gap-2">
          <div>
            <Label size="small">Why the claim isn't right</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <ProofPicker value={proof} onChange={setProof} />
          <Text size="xsmall" className="text-ui-fg-muted">The buyer can ask Maretinda to decide. Without packing proof or a courier record, disputes may be decided for the buyer.</Text>
        </div>
      )}
      {mode && (
        <Button size="small" onClick={send} isLoading={respond.isPending} data-testid="return-send">
          Send answer
        </Button>
      )}
    </div>
  )
}

const Received = ({ c }: { c: ReturnCase }) => {
  const received = useReturnReceived(c.request_id)
  const [dispute, setDispute] = useState(false)
  const [note, setNote] = useState("")
  const [proof, setProof] = useState<{ id: string; name: string }[]>([])
  const go = async (body: any, done: string) => {
    try {
      await received.mutateAsync(body)
      toast.success(done)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save. Try again.")
    }
  }
  return (
    <div className="flex flex-col gap-2" data-testid="return-received">
      {c.stage === "inspecting" ? (
        <Text size="small" weight="plus">Check it by {when(c.inspect_by)}. With no dispute, the refund goes ahead.</Text>
      ) : (
        <Text size="small" weight="plus">
          {c.stage === "in_transit" ? `On its way: ${c.return_courier}, ${c.return_tracking}.` : `The buyer has until ${when(c.ship_back_by)} to send it.`} When it arrives:
        </Text>
      )}
      <Button size="small" onClick={() => go({ outcome: "ok" }, "Thanks. The refund is being processed.")} isLoading={received.isPending}>
        It arrived and it's fine
      </Button>
      {c.stage !== "inspecting" && (
        <Button size="small" variant="secondary" onClick={() => go({}, "Marked as received. You have 48 hours to check it.")}>
          It arrived, I'll check it
        </Button>
      )}
      <Button size="small" variant="secondary" onClick={() => setDispute(!dispute)}>
        It isn't what I sent, or it's used or damaged
      </Button>
      {dispute && (
        <div className="flex flex-col gap-2">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's wrong with the returned item" />
          <ProofPicker value={proof} onChange={setProof} />
          <Button size="small" variant="danger" onClick={() => go({ outcome: "dispute", note, evidence: proof.map((p) => p.id) }, "Sent to Maretinda to decide.")}>
            Send to Maretinda
          </Button>
        </div>
      )}
    </div>
  )
}

export function RequestOrderReturn() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useReturnCase(id!)
  const c = data?.return_case

  return (
    <RouteDrawer prev="/requests/orders">
      <RouteDrawer.Header>
        <RouteDrawer.Title>Return on order {c?.order_number ? `#${c.order_number}` : ""}</RouteDrawer.Title>
      </RouteDrawer.Header>
      <RouteDrawer.Body className="flex flex-col gap-5 overflow-y-auto" data-testid="return-case" data-stage={c?.stage}>
        {isLoading ? (
          <Text>Loading…</Text>
        ) : isError || !c ? (
          <Text className="text-ui-fg-subtle">This request was made before returns needed photos. Answer it from the order, or write to support@maretinda.com.</Text>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Heading level="h3">{c.stage_label}</Heading>
              <Badge size="2xsmall" color={c.stage === "seller_review" ? "orange" : c.stage === "refunded" || c.stage === "closed" ? "grey" : "blue"}>
                {c.payment === "online" ? "Paid online" : "Cash on delivery"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              {c.items.map((i, n) => (
                <div key={n} className="flex items-center gap-3">
                  {i.thumbnail && <img src={i.thumbnail} alt="" className="h-10 w-10 rounded border object-cover" />}
                  <div>
                    <Text size="small" weight="plus">{i.quantity} × {i.title}{i.variant_title ? ` (${i.variant_title})` : ""}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">{i.reason ?? "—"} · {peso(i.unit_price)} each</Text>
                  </div>
                </div>
              ))}
              {c.buyer_note && <Text size="small" className="text-ui-fg-subtle">Buyer: “{c.buyer_note}”</Text>}
            </div>
            {c.evidence.length > 0 && (
              <div>
                <Text size="small" weight="plus" className="mb-2">The buyer's proof</Text>
                <div className="flex flex-wrap gap-2">{c.evidence.map((e) => <Evidence key={e.id} item={e} />)}</div>
              </div>
            )}

            {c.stage === "seller_review" && <Answer c={c} />}
            {["awaiting_return", "in_transit", "inspecting"].includes(c.stage) && <Received c={c} />}
            {c.stage === "declined" && <Text size="small">You disputed it. The buyer can ask Maretinda to decide.</Text>}
            {c.stage === "escalated" && <Text size="small">Maretinda is deciding, by {when(c.decide_by)}. Reply to our email with any more proof.</Text>}
            {c.decision_note && <Text size="small" className="text-ui-fg-subtle">Maretinda's decision: {c.decision_note}</Text>}

            {c.refund && (
              <div className="bg-ui-bg-subtle rounded-md p-3">
                <Text size="small" weight="plus">
                  Refund to the buyer: {peso(c.refund.amount)} {c.refund.status === "paid" ? `(sent, reference ${c.refund.reference})` : "(Maretinda is sending it)"}
                </Text>
                {c.refund.seller_charges.length > 0 && (
                  <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                    Also charged to you: {c.refund.seller_charges.map((s) => `${s.label} ${peso(s.amount)}`).join("; ")}. Taken from your payouts.
                  </Text>
                )}
              </div>
            )}

            <HowTo
              id="return-answer"
              title="How to handle a return"
              steps={[
                "Look at the buyer's photos and video. If the item really is damaged, wrong or missing parts, accept it: refund only for cheap or badly broken items, take it back otherwise.",
                "Dispute only with proof: your packing photo or video (items, their condition, and the waybill on the sealed parcel), or the courier's handover record.",
                "When the parcel comes back, check it within 48 hours. Say if it isn't what you sent, or is used or damaged, with photos.",
                "Maretinda sends the refund. It comes off this order's payout, or your next one if you were already paid.",
              ]}
            />
          </>
        )}
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <Button variant="secondary" size="small" onClick={() => navigate("/requests/orders", { replace: true })}>
          Close
        </Button>
      </RouteDrawer.Footer>
    </RouteDrawer>
  )
}
