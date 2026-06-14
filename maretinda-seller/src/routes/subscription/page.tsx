'use client'

import { useEffect, useRef, useState } from "react"
import { SingleColumnPage } from "../../components/layout/pages"
import {
  useSubscriptionStatus,
  useSubscriptionPlans,
  useSubscriptionCheckout,
  useActivateSubscription,
  useStartTrial,
  type SubscriptionPlan,
  type CheckoutResponse,
  type ActivateResponse,
} from "../../hooks/api/subscription"

// ---------------------------------------------------------------------------
// Static plan metadata (tier label, tagline, popular, CTA)
// ---------------------------------------------------------------------------
const PLAN_META: Record<string, {
  tier: string
  tagline: string
  popular: boolean
  icon: string
}> = {
  Starter: { tier: "STARTER", tagline: "Perfect to get started", popular: false, icon: "✦" },
  Growth:  { tier: "GROWTH",  tagline: "For scaling businesses", popular: true,  icon: "↗" },
  Premium: { tier: "PREMIUM", tagline: "For high-volume brands", popular: false, icon: "◎" },
}

// ---------------------------------------------------------------------------
// Feature display logic
// ---------------------------------------------------------------------------
interface FeatureRow {
  label: string
  value: string | boolean | "coming_soon" | null
}

function buildFeatureRows(features: Record<string, unknown>): FeatureRow[] {
  const rows: FeatureRow[] = []

  const products = Number(features.max_products)
  rows.push({
    label: products === -1 ? "Unlimited products" : `Up to ${products} products`,
    value: true,
  })

  const analytics = features.analytics as string | undefined
  const analyticsLabel =
    analytics === "basic" ? "Basic analytics dashboard"
    : analytics === "advanced" ? "Advanced analytics & reports"
    : analytics === "premium" ? "Full analytics suite + exports"
    : "Analytics dashboard"
  rows.push({ label: analyticsLabel, value: true })

  rows.push({ label: "Standard storefront", value: true })

  const staff = features.staff_accounts != null ? Number(features.staff_accounts) : null
  if (staff != null && !isNaN(staff)) {
    rows.push({
      label: staff === 1 ? "1 staff account" : `${staff} staff accounts`,
      value: true,
    })
  }

  rows.push({ label: "GiyaPay payments", value: true })

  const inv = features.inventory as string | undefined
  const invLabel =
    inv === "standard" ? "Inventory management"
    : inv === "smart" ? "Smart inventory + alerts"
    : inv === "advanced" ? "Advanced inventory + forecasting"
    : "Inventory management"
  rows.push({ label: invLabel, value: true })

  const support = features.support as string | undefined
  const supportLabel =
    support === "email" ? "Email support"
    : support === "priority" ? "Priority email & live chat"
    : support === "dedicated" ? "Dedicated account manager"
    : "Email support"
  rows.push({ label: supportLabel, value: true })

  rows.push({ label: "Flash sales & vouchers", value: Boolean(features.flash_sales) })
  rows.push({ label: "Subscription products",  value: Boolean(features.subscription_products) })

  if (features.dedicated_manager === true) {
    rows.push({ label: "Dedicated account manager", value: true })
  }

  if (features.sla === true) {
    rows.push({ label: "99.9% SLA guarantee", value: true })
  }

  const model3d = features.model_3d
  if (model3d === "coming_soon") {
    rows.push({ label: "3D Model Generation", value: "coming_soon" })
  } else {
    rows.push({ label: "3D Model Generation", value: Boolean(model3d) })
  }

  return rows
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

function useCountdown(endDate: string | null | undefined) {
  const [remaining, setRemaining] = useState<{
    days: number; hours: number; minutes: number; seconds: number
  } | null>(null)

  useEffect(() => {
    if (!endDate) return
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) { setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setRemaining({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [endDate])

  return remaining
}

type PlanChangeType = "subscribe" | "renew" | "upgrade" | "downgrade"

function getPlanChangeType(plan: SubscriptionPlan, currentPlanName: string | null, plans: SubscriptionPlan[]): PlanChangeType {
  if (!currentPlanName) return "subscribe"
  if (plan.name === currentPlanName) return "renew"
  const currentPlan = plans.find(p => p.name === currentPlanName)
  if (!currentPlan) return "subscribe"
  // Coerce to Number — postgres numeric columns are returned as strings,
  // and string comparison ("999" > "5999") would be wrong.
  return Number(plan.price) > Number(currentPlan.price) ? "upgrade" : "downgrade"
}

// ---------------------------------------------------------------------------
// GiyaPay auto-submit form
// ---------------------------------------------------------------------------
function GiyaPayAutoSubmit({
  checkoutUrl, formData, selectedMethod, onCancel,
}: {
  checkoutUrl: string; formData: Record<string, string>; selectedMethod: string; onCancel: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => formRef.current?.submit(), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="rounded-2xl bg-white p-8 shadow-2xl text-center max-w-sm w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mx-auto mb-4" />
        <p className="text-sm font-semibold text-gray-700">Redirecting to GiyaPay…</p>
        <p className="mt-1 text-xs text-gray-400">Do not close this tab.</p>
        <form ref={formRef} method="POST" action={checkoutUrl} className="hidden">
          {Object.entries(formData).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input type="hidden" name="payment_method" value={selectedMethod} />
        </form>
        <button onClick={onCancel} className="mt-4 text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Payment method selector modal
// ---------------------------------------------------------------------------
const GATEWAY_LABELS: Record<string, string> = {
  GCASH: "GCash",
  PAYMAYA: "PayMaya",
  INSTAPAY: "InstaPay",
  "MASTERCARD/VISA": "Mastercard / Visa",
  QRPH: "QR Ph",
}

function MethodModal({ methods, onSelect, onCancel }: {
  methods: string[]; onSelect: (m: string) => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
        <div className="flex flex-col gap-2">
          {methods.map((m) => (
            <button key={m} onClick={() => onSelect(m)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:border-violet-400 hover:bg-violet-50 transition-colors">
              {GATEWAY_LABELS[m] || m}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Downgrade confirmation modal
// ---------------------------------------------------------------------------
function DowngradeModal({ planName, currentPlanName, onConfirm, onCancel }: {
  planName: string; currentPlanName: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Confirm Downgrade</h3>
            <p className="text-xs text-gray-500">{currentPlanName} → {planName}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Downgrading from <strong>{currentPlanName}</strong> to <strong>{planName}</strong> will take effect immediately. Some features may no longer be available.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Yes, Downgrade</button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trial start confirmation modal
// ---------------------------------------------------------------------------
function TrialModal({ plan, onConfirm, onCancel, loading }: {
  plan: SubscriptionPlan; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Start Free Trial</h3>
            <p className="text-xs text-gray-500">{plan.trial_days}-day free trial of {plan.name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          You'll get <strong>{plan.trial_days} days</strong> of full access to the <strong>{plan.name}</strong> plan at no cost.
          No credit card required to start. At the end of the trial, you can subscribe to continue.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
            {loading ? "Starting…" : "Start Free Trial"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Countdown box
// ---------------------------------------------------------------------------
function CountdownBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl bg-[#1e1e2e] border border-white/10 px-4 py-3 min-w-[56px] text-center">
        <span className="text-2xl font-extrabold text-white tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Payment result banners
// ---------------------------------------------------------------------------
type PaymentState = "idle" | "verifying" | "success" | "error" | "cancelled"

function PaymentResultBanner({ state, result, onDismiss }: {
  state: PaymentState; result: ActivateResponse | null; onDismiss: () => void
}) {
  if (state === "verifying") {
    return (
      <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 flex items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-300">Verifying your payment…</p>
          <p className="text-xs text-violet-400 mt-0.5">Please wait while we activate your subscription.</p>
        </div>
      </div>
    )
  }

  if (state === "success" && result) {
    const sub = result.subscription
    const plan = result.plan
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-green-300">
              {result.already_activated ? "Subscription Already Active" : "Subscription Activated!"}
            </p>
            <p className="text-xs text-green-400 mt-1">
              Welcome to <strong>{plan?.name || sub.plan_name}</strong>!
              {sub.end_date ? ` Active until ${formatDate(sub.end_date)}.` : ""}
            </p>
            {sub.payment_reference && (
              <p className="text-xs text-green-500/70 mt-0.5 font-mono">Ref: {sub.payment_reference}</p>
            )}
          </div>
          <button onClick={onDismiss} className="text-green-400/60 hover:text-green-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-300">Payment Failed</p>
          <p className="text-xs text-red-400 mt-1">We could not process your payment. No charges were made. Please try again.</p>
        </div>
        <button onClick={onDismiss} className="text-red-400/60 hover:text-red-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  if (state === "cancelled") {
    return (
      <div className="rounded-2xl border border-gray-500/30 bg-gray-500/10 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-300">Payment Cancelled</p>
          <p className="text-xs text-gray-400 mt-1">No charges were made. Select a plan below to try again.</p>
        </div>
        <button onClick={onDismiss} className="text-gray-400/60 hover:text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Plan card — styled to match the reference design
// ---------------------------------------------------------------------------
function PlanCard({
  plan, billing, currentPlanName, allPlans, onSelect, onTrial,
  isEligibleForTrial, loading,
}: {
  plan: SubscriptionPlan
  billing: "monthly" | "yearly"
  currentPlanName: string | null
  allPlans: SubscriptionPlan[]
  onSelect: (plan: SubscriptionPlan) => void
  onTrial: (plan: SubscriptionPlan) => void
  isEligibleForTrial: boolean
  loading: boolean
}) {
  const meta = PLAN_META[plan.name] || { tier: plan.name.toUpperCase(), tagline: "", popular: false, icon: "◆" }
  const isCurrent = plan.name === currentPlanName
  const changeType = getPlanChangeType(plan, currentPlanName, allPlans)
  const isPopular = meta.popular

  const monthlyPrice = Number(plan.price)
  const yearlyTotal = plan.yearly_price != null ? Number(plan.yearly_price) : Math.round(monthlyPrice * 12 * 0.83)
  const yearlyMonthly = Math.round(yearlyTotal / 12)
  const displayPrice = billing === "yearly" ? yearlyMonthly : monthlyPrice

  const discountPct = plan.yearly_discount_percent != null
    ? Number(plan.yearly_discount_percent)
    : (yearlyTotal && monthlyPrice ? Math.round((1 - yearlyTotal / (monthlyPrice * 12)) * 100) : 17)

  const trialDays = Number(plan.trial_days) || 0
  const hasTrial = trialDays > 0 && isEligibleForTrial && !currentPlanName

  const features = plan.features ? buildFeatureRows(plan.features) : []

  // Card styles — popular card gets dark purple background
  const cardBg = isPopular
    ? "bg-gradient-to-b from-[#2d1f5e] to-[#1a1030]"
    : "bg-[#16161e] hover:bg-[#1c1c2a]"
  const cardBorder = isCurrent
    ? "border-green-500/60 ring-2 ring-green-500/30"
    : isPopular
    ? "border-violet-500/40"
    : changeType === "upgrade"
    ? "border-violet-400/30"
    : changeType === "downgrade"
    ? "border-orange-400/30"
    : "border-white/5"
  const tierColor = isPopular ? "text-amber-400" : "text-violet-400"
  const nameColor = isPopular ? "text-white" : "text-white"
  const taglineColor = isPopular ? "text-violet-200/70" : "text-gray-400"
  const priceColor = isPopular ? "text-white" : "text-white"
  const periodColor = isPopular ? "text-violet-300/60" : "text-gray-500"
  const featureTextColor = isPopular ? "text-violet-100" : "text-gray-300"
  const featureDisabledColor = isPopular ? "text-white/20" : "text-gray-600"
  const dividerColor = isPopular ? "border-white/10" : "border-white/5"

  const getButtonStyle = () => {
    if (isCurrent)     return "bg-green-600 text-white hover:bg-green-700"
    if (isPopular)     return "bg-amber-400 text-gray-900 hover:bg-amber-300 font-extrabold"
    if (changeType === "upgrade") return "bg-violet-600 text-white hover:bg-violet-700"
    if (changeType === "downgrade") return "border border-orange-500 text-orange-400 hover:bg-orange-500/10"
    return "border border-violet-500 text-violet-300 hover:bg-violet-500/10"
  }

  const getButtonLabel = () => {
    if (isCurrent) return "Current Plan"
    if (changeType === "renew") return "Renew Plan"
    if (changeType === "upgrade") return `Upgrade to ${plan.name}`
    if (changeType === "downgrade") return `Downgrade to ${plan.name}`
    if (isPopular) return "Start Growing Now →"
    if (plan.name === "Premium") return "Contact Sales →"
    return "Get Started Free →"
  }

  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${cardBg} ${cardBorder}`}>
      {/* Popular badge */}
      {isPopular && !isCurrent && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-amber-400 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-900 shadow-lg">
            Most Popular
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-green-500 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
            Current Plan
          </span>
        </div>
      )}
      {!isCurrent && changeType === "upgrade" && !isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-violet-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
            Upgrade
          </span>
        </div>
      )}

      {/* Header section */}
      <div className={`p-6 border-b ${dividerColor}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
            isPopular ? "bg-white/10 text-white" : "bg-white/5 text-violet-400"
          }`}>
            {meta.icon}
          </div>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-widest ${tierColor}`}>{meta.tier}</p>
            <h3 className={`text-xl font-extrabold leading-tight mt-0.5 ${nameColor}`}>{plan.name}</h3>
            <p className={`text-xs mt-0.5 ${taglineColor}`}>{meta.tagline}</p>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-end gap-1">
            <span className={`text-[11px] font-bold -mb-1 ${isPopular ? "text-amber-400" : "text-violet-400"}`}>₱</span>
            <span className={`text-4xl font-extrabold tabular-nums ${priceColor}`}>
              {displayPrice.toLocaleString()}
            </span>
            <span className={`text-xs mb-1 ml-1 ${periodColor}`}>/mo</span>
          </div>
          {billing === "yearly" && (
            <p className={`text-xs mt-1 ${isPopular ? "text-amber-300/80" : "text-violet-400"}`}>
              Billed ₱{yearlyTotal.toLocaleString()}/year · Save {discountPct}%
            </p>
          )}
          {hasTrial && billing === "monthly" && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-500/30 px-2.5 py-0.5">
              <span className="text-[10px] text-violet-300 font-semibold">{trialDays}-day free trial</span>
            </div>
          )}
        </div>
      </div>

      {/* Features list */}
      <div className="flex-1 p-6">
        <ul className="space-y-2.5">
          {features.map((f, i) => {
            if (f.value === "coming_soon") {
              return (
                <li key={i} className={`flex items-center gap-2.5 text-xs ${featureTextColor}`}>
                  <span className="text-amber-400 text-sm flex-shrink-0">◑</span>
                  <span>{f.label}</span>
                  <span className="ml-auto rounded-full bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">Soon</span>
                </li>
              )
            }
            if (!f.value) {
              return (
                <li key={i} className={`flex items-center gap-2.5 text-xs ${featureDisabledColor}`}>
                  <span className="flex-shrink-0 text-sm">—</span>
                  <span className="line-through">{f.label}</span>
                </li>
              )
            }
            return (
              <li key={i} className={`flex items-center gap-2.5 text-xs ${featureTextColor}`}>
                <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{f.label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* CTA buttons */}
      <div className={`p-6 pt-0 flex flex-col gap-2`}>
        <button
          disabled={loading}
          onClick={() => onSelect(plan)}
          className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-50 ${getButtonStyle()}`}
        >
          {loading ? "Processing…" : getButtonLabel()}
        </button>
        {hasTrial && (
          <button
            disabled={loading}
            onClick={() => onTrial(plan)}
            className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
          >
            Start {trialDays}-day free trial
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trial active banner
// ---------------------------------------------------------------------------
function TrialBanner({
  subscription, onUpgrade,
}: {
  subscription: { plan_name: string; trial_ends_at: string | null; end_date: string | null }
  onUpgrade: () => void
}) {
  const endDate = subscription.trial_ends_at || subscription.end_date
  const countdown = useCountdown(endDate)
  if (!countdown) return null

  const isExpiringSoon = endDate
    ? (new Date(endDate).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000
    : false

  return (
    <div className={`rounded-2xl border p-5 ${
      isExpiringSoon
        ? "border-red-500/30 bg-red-500/10"
        : "border-amber-500/30 bg-amber-500/10"
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isExpiringSoon ? "bg-red-500/20" : "bg-amber-500/20"
          }`}>
            <svg className={`w-4 h-4 ${isExpiringSoon ? "text-red-400" : "text-amber-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-bold ${isExpiringSoon ? "text-red-300" : "text-amber-300"}`}>
              {isExpiringSoon ? "⚠ Trial ending soon!" : `🎉 Free trial of ${subscription.plan_name}`}
            </p>
            {endDate && (
              <p className={`text-xs mt-0.5 ${isExpiringSoon ? "text-red-400" : "text-amber-400/80"}`}>
                Expires on {formatDate(endDate)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {[
              { v: countdown.days,    l: "Days" },
              { v: countdown.hours,   l: "Hours" },
              { v: countdown.minutes, l: "Mins" },
              { v: countdown.seconds, l: "Secs" },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center">
                <div className={`rounded-lg px-2.5 py-1.5 min-w-[40px] text-center border ${
                  isExpiringSoon ? "bg-red-500/20 border-red-500/30" : "bg-amber-500/20 border-amber-500/30"
                }`}>
                  <span className={`text-lg font-extrabold tabular-nums ${isExpiringSoon ? "text-red-200" : "text-amber-200"}`}>
                    {String(v).padStart(2, "0")}
                  </span>
                </div>
                <span className={`mt-1 text-[9px] uppercase tracking-widest ${isExpiringSoon ? "text-red-500" : "text-amber-600"}`}>{l}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onUpgrade}
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-gray-900 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            Upgrade Now →
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Active subscription card
// ---------------------------------------------------------------------------
function ActiveSubscriptionCard({ subscription }: {
  subscription: { plan_name: string; billing_period: string; status: string; start_date: string; end_date: string; price: number; payment_reference?: string | null }
}) {
  const countdown = useCountdown(subscription.end_date)
  const isExpiring = subscription.end_date
    ? (new Date(subscription.end_date).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <div className="rounded-2xl border border-white/10 bg-[#16161e] p-6">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Current Plan</p>
          <p className="mt-1 text-3xl font-extrabold text-white">{subscription.plan_name}</p>
          <p className="mt-0.5 text-sm text-gray-500 capitalize">{subscription.billing_period || "monthly"} billing</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
          subscription.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : subscription.status === "expired" ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
        }`}>
          {subscription.status}
        </span>
      </div>

      {subscription.end_date && countdown && (
        <div className={`rounded-xl p-4 mb-4 ${isExpiring ? "bg-red-500/10 border border-red-500/20" : "bg-white/5 border border-white/5"}`}>
          <p className={`text-xs font-semibold mb-3 ${isExpiring ? "text-red-400" : "text-gray-500"}`}>
            {isExpiring ? "⚠ Expiring soon — renew now!" : "Subscription expires in"}
          </p>
          <div className="flex gap-3 flex-wrap">
            <CountdownBox label="Days" value={countdown.days} />
            <CountdownBox label="Hours" value={countdown.hours} />
            <CountdownBox label="Mins" value={countdown.minutes} />
            <CountdownBox label="Secs" value={countdown.seconds} />
          </div>
          <p className="mt-3 text-xs text-gray-500">Expires on {formatDate(subscription.end_date)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-gray-500">Started</p>
          <p className="font-semibold text-gray-200 mt-0.5">{formatDate(subscription.start_date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Price paid</p>
          <p className="font-semibold text-gray-200 mt-0.5">₱{subscription.price.toLocaleString()}</p>
        </div>
        {subscription.payment_reference && (
          <div>
            <p className="text-gray-500">Payment ref</p>
            <p className="font-mono text-gray-400 break-all mt-0.5">{subscription.payment_reference}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const SubscriptionPage = () => {
  const { data, isLoading } = useSubscriptionStatus()
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans()
  const checkout = useSubscriptionCheckout()
  const activate = useActivateSubscription()
  const startTrial = useStartTrial()

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [methodModal, setMethodModal] = useState<{ methods: string[]; checkoutData: CheckoutResponse } | null>(null)
  const [paymentReady, setPaymentReady] = useState<{ checkoutUrl: string; formData: Record<string, string>; selectedMethod: string } | null>(null)
  const [downgradeModal, setDowngradeModal] = useState<SubscriptionPlan | null>(null)
  const [trialModal, setTrialModal] = useState<SubscriptionPlan | null>(null)
  const [scrollToPlans, setScrollToPlans] = useState(false)
  const plansRef = useRef<HTMLDivElement>(null)

  const [paymentState, setPaymentState] = useState<PaymentState>("idle")
  const [paymentResult, setPaymentResult] = useState<ActivateResponse | null>(null)

  // Detect GiyaPay callback params on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)
    window.history.replaceState({}, "", window.location.pathname)

    if (hash === "#payment-error")     { setPaymentState("error");     return }
    if (hash === "#payment-cancelled") { setPaymentState("cancelled"); return }

    const signature = params.get("signature")
    const order_id  = params.get("order_id")
    const refno     = params.get("refno")
    const nonce     = params.get("nonce")
    const timestamp = params.get("timestamp")
    const amount    = params.get("amount")

    if (signature && order_id && String(order_id).startsWith("vrenew_") && refno && nonce && timestamp && amount) {
      setPaymentState("verifying")
      activate.mutate(
        { order_id, refno, nonce, timestamp, amount, signature },
        {
          onSuccess: (result) => { setPaymentResult(result); setPaymentState("success") },
          onError:   ()       => setPaymentState("error"),
        }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrollToPlans && plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: "smooth" })
      setScrollToPlans(false)
    }
  }, [scrollToPlans])

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    const plans = plansData?.plans || []
    const changeType = getPlanChangeType(plan, data?.subscription?.plan_name ?? null, plans)
    if (changeType === "downgrade") { setDowngradeModal(plan); return }
    await initiateCheckout(plan)
  }

  const initiateCheckout = async (plan: SubscriptionPlan) => {
    try {
      const result = await checkout.mutateAsync({ plan_name: plan.name, billing_period: billing })
      setMethodModal({ methods: result.enabled_methods, checkoutData: result })
    } catch (err: any) {
      alert(err?.message || "Failed to initiate checkout. Please try again.")
    }
  }

  const handleMethodSelect = (method: string) => {
    if (!methodModal) return
    setMethodModal(null)
    setPaymentReady({
      checkoutUrl: methodModal.checkoutData.checkout_url,
      formData: methodModal.checkoutData.form_data,
      selectedMethod: method,
    })
  }

  const handleTrialStart = async (plan: SubscriptionPlan) => {
    try {
      await startTrial.mutateAsync({ plan_name: plan.name })
      setTrialModal(null)
    } catch (err: any) {
      alert(err?.message || "Failed to start trial. Please try again.")
    }
  }

  if (isLoading || plansLoading) {
    return (
      <SingleColumnPage widgets={{ after: [], before: [] }}>
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent" />
        </div>
      </SingleColumnPage>
    )
  }

  const has_subscription = data?.has_subscription ?? false
  const has_ever_subscribed = data?.has_ever_subscribed ?? false
  const subscription = data?.subscription ?? null
  const plans = plansData?.plans || []
  const isTrialActive = Boolean(subscription?.is_trial && subscription?.status === "active")
  const isEligibleForTrial = !has_ever_subscribed

  // Global discount % across plans (use first plan's discount or default 17%)
  const displayDiscountPct = plans[0]?.yearly_discount_percent ?? 17

  return (
    <SingleColumnPage widgets={{ after: [], before: [] }}>
      {/* Modals */}
      {methodModal && (
        <MethodModal methods={methodModal.methods} onSelect={handleMethodSelect} onCancel={() => setMethodModal(null)} />
      )}
      {paymentReady && (
        <GiyaPayAutoSubmit
          checkoutUrl={paymentReady.checkoutUrl}
          formData={paymentReady.formData}
          selectedMethod={paymentReady.selectedMethod}
          onCancel={() => setPaymentReady(null)}
        />
      )}
      {downgradeModal && (
        <DowngradeModal
          planName={downgradeModal.name}
          currentPlanName={subscription?.plan_name || ""}
          onConfirm={() => { const plan = downgradeModal; setDowngradeModal(null); initiateCheckout(plan) }}
          onCancel={() => setDowngradeModal(null)}
        />
      )}
      {trialModal && (
        <TrialModal
          plan={trialModal}
          loading={startTrial.isPending}
          onConfirm={() => handleTrialStart(trialModal)}
          onCancel={() => setTrialModal(null)}
        />
      )}

      <div className="flex flex-col gap-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your Maretinda seller subscription. Payments are processed via GiyaPay.
          </p>
        </div>

        {/* Payment result banner */}
        {paymentState !== "idle" && (
          <PaymentResultBanner
            state={paymentState}
            result={paymentResult}
            onDismiss={() => { setPaymentState("idle"); setPaymentResult(null) }}
          />
        )}

        {/* Trial banner */}
        {isTrialActive && subscription && (
          <TrialBanner
            subscription={subscription}
            onUpgrade={() => setScrollToPlans(true)}
          />
        )}

        {/* Active subscription card (non-trial) */}
        {has_subscription && subscription && !isTrialActive && (
          <ActiveSubscriptionCard subscription={subscription} />
        )}

        {/* No subscription */}
        {!has_subscription && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#16161e] p-8 text-center">
            <p className="text-sm font-semibold text-gray-300">No active subscription</p>
            <p className="mt-1 text-sm text-gray-500">Select a plan below to get started.</p>
          </div>
        )}

        {/* Plan selection */}
        <div ref={plansRef}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-white">
              {has_subscription && !isTrialActive ? "Renew or Change Plan" : "Choose a Plan"}
            </h2>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#16161e] p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  billing === "monthly" ? "bg-violet-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  billing === "yearly" ? "bg-violet-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                Annual
                <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase">
                  Save {displayDiscountPct}%
                </span>
              </button>
            </div>
          </div>

          {/* Legend when subscribed */}
          {has_subscription && !isTrialActive && (
            <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Current Plan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-violet-500" /> Upgrade (activates immediately)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500" /> Downgrade (requires confirmation)
              </span>
            </div>
          )}

          {plans.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billing={billing}
                  currentPlanName={has_subscription && !isTrialActive ? subscription?.plan_name ?? null : null}
                  allPlans={plans}
                  onSelect={handleSelectPlan}
                  onTrial={(p) => setTrialModal(p)}
                  isEligibleForTrial={isEligibleForTrial}
                  loading={checkout.isPending}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No plans available.</p>
          )}
        </div>

        {/* Footer note */}
        <div className="rounded-xl border border-white/5 bg-[#16161e] px-4 py-3 text-xs text-gray-500">
          Payments are processed securely by{" "}
          <span className="text-violet-400 font-semibold">GiyaPay</span>.
          After payment, your subscription is activated automatically.
        </div>
      </div>
    </SingleColumnPage>
  )
}

export default SubscriptionPage
