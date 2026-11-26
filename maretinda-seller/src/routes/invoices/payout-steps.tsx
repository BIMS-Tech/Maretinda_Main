import { CheckCircleSolid, ExclamationCircle } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { motion, useReducedMotion } from "motion/react"
import { Link } from "react-router-dom"

import { CountUp, EASE_OUT } from "../../components/common/motion/motion"
import { useMe } from "../../hooks/api/users"
import { fetchQuery } from "../../lib/client/client"
import { getSettlementInfo } from "../../lib/settlement"

type Settlements = {
  hold_days: number
  summary: { ready: number; holding: number; awaiting_delivery: number; return_open: number; paid_total: number }
}
type Cod = { summary: Record<"with_courier" | "to_pay_seller" | "paid", { count: number; amount: number }> }

const peso = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type Step = { title: string; body: string; amount?: number; note?: string; done?: boolean }

/** One row of steps; each shows how much of the shop's money is at that step now. */
function Steps({ steps, label }: { steps: Step[]; label: string }) {
  const reduce = useReducedMotion()
  return (
    <ol aria-label={label} className="grid grid-cols-1 gap-4 md:grid-flow-col md:auto-cols-fr md:gap-0">
      {steps.map((step, i) => {
        const here = (step.amount ?? 0) > 0
        return (
          <motion.li
            key={step.title}
            className="relative flex gap-3 md:flex-col md:pr-5"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 * i }}
          >
            {/* The line on to the next step draws itself in */}
            {i < steps.length - 1 && (
              <motion.span
                aria-hidden
                className="bg-ui-border-strong absolute left-[15px] top-9 h-[calc(100%-12px)] w-px origin-top md:left-9 md:right-1 md:top-[15px] md:h-px md:w-auto md:origin-left"
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 + 0.08 * i }}
              />
            )}
            <span
              className={clx(
                "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                step.done
                  ? "bg-ui-tag-green-icon text-white"
                  : here
                    ? "bg-ui-bg-interactive text-white"
                    : "bg-ui-bg-base text-ui-fg-muted shadow-borders-base"
              )}
            >
              {step.done ? <CheckCircleSolid /> : i + 1}
            </span>
            <div className="min-w-0 pb-1 md:pt-3">
              <Text size="small" weight="plus">{step.title}</Text>
              <Text size="xsmall" className="text-ui-fg-subtle mt-0.5 text-pretty">{step.body}</Text>
              {step.amount !== undefined && (
                <p className={clx("mt-2 text-[15px] font-semibold tabular-nums", here ? "text-ui-fg-base" : "text-ui-fg-muted")}>
                  <CountUp value={step.amount} format={peso} />
                </p>
              )}
              {step.note && <Text size="xsmall" className="text-ui-fg-muted">{step.note}</Text>}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}

/**
 * How a sale becomes money in the shop's bank, step by step: online payments
 * through GiyaPay, and cash on delivery through the courier. Each step shows
 * what is at it now, from the same ledger the bank files are made from.
 */
export const PayoutSteps = () => {
  const { seller } = useMe()
  const settlements = useQuery({
    queryKey: ["vendor", "settlements"],
    queryFn: () => fetchQuery("/vendor/settlements", { method: "GET" }) as Promise<Settlements>,
  })
  const cod = useQuery({
    queryKey: ["vendor", "cod-remittances"],
    queryFn: () => fetchQuery("/vendor/cod-remittances", { method: "GET", query: { limit: 100 } }) as Promise<Cod>,
  })

  const s = settlements.data?.summary
  const days = settlements.data?.hold_days ?? 14
  const bank = seller ? getSettlementInfo(seller) : null
  const last4 = bank?.accountNumber.replace(/\s/g, "").slice(-4)
  const sent = bank?.isMetrobank ? "a TAMA file (Metrobank)" : "a DFT file (other banks)"

  const online: Step[] = [
    {
      title: "Buyer pays online",
      body: "Through GiyaPay: GCash, cards or InstaPay. Maretinda holds the money for you.",
      amount: s ? s.awaiting_delivery + s.holding + s.return_open + s.ready : undefined,
      note: "Not paid to you yet",
    },
    {
      title: "Order delivered",
      body: "The courier marks it delivered. Until then it waits here.",
      amount: s?.awaiting_delivery,
    },
    {
      title: `${days}-day hold`,
      body: "Covers the buyer's 7-day return window. An open return holds that order until it's decided.",
      amount: s ? s.holding + s.return_open : undefined,
      note: s?.return_open ? `${peso(s.return_open)} waiting on a return` : undefined,
    },
    {
      title: "In the next bank file",
      body: `GiyaPay sends ${bank?.bankName ? sent : "a TAMA (Metrobank) or DFT (other banks) file"} on the next banking day.`,
      amount: s?.ready,
    },
    {
      title: "In your bank",
      body: "Credited to your account, after the 2.5% processing fee and ₱5 per payment.",
      amount: s?.paid_total,
      done: (s?.paid_total ?? 0) > 0,
    },
  ]

  const c = cod.data?.summary
  const cash: Step[] = [
    { title: "Buyer pays the courier", body: "In cash, when the parcel arrives.", amount: c?.with_courier.amount },
    { title: "Courier hands it to Maretinda", body: `Then it follows the same ${days}-day hold after delivery.`, amount: c?.to_pay_seller.amount },
    { title: "Maretinda pays you", body: "By bank transfer, to the same account.", amount: c?.paid.amount, done: (c?.paid.amount ?? 0) > 0 },
  ]

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">How you get paid</Heading>
          <Text size="small" className="text-ui-fg-subtle">Where the money from your sales is now, step by step.</Text>
        </div>
        {bank &&
          (bank.isComplete ? (
            <Link
              to="/settings/store/edit"
              className="bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
            >
              <CheckCircleSolid className="text-ui-tag-green-icon" />
              <Text size="small">
                Paid to <b>{bank.bankName}</b>
                {last4 ? ` •••• ${last4}` : ""} · {bank.isMetrobank ? "TAMA" : "DFT"}
              </Text>
            </Link>
          ) : (
            <Link
              to="/settings/store/edit"
              data-testid="payout-bank-missing"
              className="bg-ui-tag-orange-bg border-ui-tag-orange-border text-ui-tag-orange-text flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <ExclamationCircle />
              <Text size="small" weight="plus">Add your bank details so payouts can be sent</Text>
            </Link>
          ))}
      </div>

      <div className="px-6 py-5">
        <Text size="xsmall" weight="plus" className="text-ui-fg-muted mb-4 uppercase tracking-wider">
          Online payments
        </Text>
        {settlements.isError ? (
          <Text size="small" className="text-ui-fg-error">Could not load your payouts. Refresh to try again.</Text>
        ) : (
          <Steps label="Online payment steps" steps={online} />
        )}
      </div>

      <div className="px-6 py-5">
        <Text size="xsmall" weight="plus" className="text-ui-fg-muted mb-4 uppercase tracking-wider">
          Cash on delivery
        </Text>
        {cod.isError ? (
          <Text size="small" className="text-ui-fg-error">Could not load your cash on delivery. Refresh to try again.</Text>
        ) : (
          <div className="md:max-w-[60%]">
            <Steps label="Cash on delivery steps" steps={cash} />
          </div>
        )}
      </div>
    </Container>
  )
}
