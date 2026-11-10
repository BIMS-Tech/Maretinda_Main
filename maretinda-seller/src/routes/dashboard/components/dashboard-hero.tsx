import { MediaPlay, Plus, ReceiptPercent } from "@medusajs/icons"
import { Link } from "react-router-dom"
import { useMe } from "../../../hooks/api"
import { usePlanLimits } from "../../../hooks/api/plan-limits"
import { useSubscriptionStatus } from "../../../hooks/api/subscription"
import { daysLeft } from "../dashboard-stats"

const greeting = (hour: number) => (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening")

/**
 * The top of the dashboard, in the brand's purple: who you are, how long your
 * plan has left, and the things sellers do most often.
 */
export const DashboardHero = () => {
  const { seller } = useMe()
  const { planName } = usePlanLimits()
  const { data: subscription } = useSubscriptionStatus()
  const left = daysLeft(subscription?.subscription?.end_date)
  const marketing = planName === "Growth" || planName === "Premium"

  const actions = [
    { label: "Add product", to: "/products/create", icon: Plus },
    ...(marketing ? [{ label: "Create voucher", to: "/promotions/create", icon: ReceiptPercent }] : []),
    { label: "Post a reel", to: "/reels/create", icon: MediaPlay },
  ]

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-elevation-card-rest"
      style={{ background: "linear-gradient(120deg, #432C63 0%, #5B3A8A 60%, #6E4BA3 100%)" }}
    >
      {/* Soft yellow glow, the brand's accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "#FFC533" }}
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-white/70">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">
            {greeting(new Date().getHours())}
            {seller?.name ? `, ${seller.name}` : ""}
          </h1>
          {planName && (
            <Link
              to="/subscription"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur transition-colors hover:bg-white/20"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: "#FFC533" }} />
              {planName} plan
              {left !== null && <span className="text-white/70">· {left === 1 ? "1 day left" : `${left} days left`}</span>}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(({ label, to, icon: Icon }, i) => (
            <Link
              key={to}
              to={to}
              className={
                i === 0
                  ? "transition-fg inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-[#2A1B3F] shadow-sm hover:brightness-105"
                  : "transition-fg inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white hover:bg-white/20"
              }
              style={i === 0 ? { background: "#FFC533" } : undefined}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
