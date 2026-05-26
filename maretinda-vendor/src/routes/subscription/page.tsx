'use client'

import { useEffect, useRef, useState } from "react"
import { SingleColumnPage } from "../../components/layout/pages"
import {
  useSubscriptionStatus,
  useSubscriptionPlans,
  useSubscriptionCheckout,
  type SubscriptionPlan,
  type CheckoutResponse,
} from "../../hooks/api/subscription"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
}

function statusColor(status: string) {
  if (status === "active") return "bg-green-100 text-green-800"
  if (status === "expired") return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-500"
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
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
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

const FEATURE_LABELS: Record<string, string> = {
  max_products: "Products",
  analytics: "Analytics",
  priority_support: "Priority Support",
  featured_listings: "Featured Listings",
  dedicated_manager: "Dedicated Manager",
}

function featureDisplay(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (value === -1) return "Unlimited"
  if (typeof value === "string") return value.charAt(0).toUpperCase() + value.slice(1)
  return String(value)
}

// ---------------------------------------------------------------------------
// GiyaPay auto-submit form
// ---------------------------------------------------------------------------
function GiyaPayAutoSubmit({
  checkoutUrl,
  formData,
  selectedMethod,
  onCancel,
}: {
  checkoutUrl: string
  formData: Record<string, string>
  selectedMethod: string
  onCancel: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => formRef.current?.submit(), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-2xl bg-white p-8 shadow-2xl text-center max-w-sm w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
        <p className="text-sm font-semibold text-gray-700">Redirecting to GiyaPay…</p>
        <p className="mt-1 text-xs text-gray-400">Do not close this tab.</p>
        <form ref={formRef} method="POST" action={checkoutUrl} className="hidden">
          {Object.entries(formData).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input type="hidden" name="payment_method" value={selectedMethod} />
        </form>
        <button onClick={onCancel} className="mt-4 text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Method selector modal
// ---------------------------------------------------------------------------
const GATEWAY_LABELS: Record<string, string> = {
  "GCASH": "GCash",
  "PAYMAYA": "PayMaya",
  "INSTAPAY": "InstaPay",
  "MASTERCARD/VISA": "Mastercard / Visa",
  "QRPH": "QR Ph",
}

function MethodModal({
  methods,
  onSelect,
  onCancel,
}: {
  methods: string[]
  onSelect: (m: string) => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Choose Payment Method</h3>
        <div className="flex flex-col gap-2">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => onSelect(m)}
              className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              {GATEWAY_LABELS[m] || m}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------
function PlanCard({
  plan,
  billing,
  currentPlanName,
  onSelect,
  loading,
}: {
  plan: SubscriptionPlan
  billing: "monthly" | "yearly"
  currentPlanName: string | null
  onSelect: (plan: SubscriptionPlan) => void
  loading: boolean
}) {
  const isCurrent = plan.name === currentPlanName
  const isPopular = plan.name === "Boost"
  const price = billing === "yearly" ? (plan.yearly_price ?? plan.price * 10) : plan.price
  const yearlyMonthly = plan.yearly_price ? Math.round(plan.yearly_price / 12) : Math.round(plan.price * 10 / 12)

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
        isCurrent
          ? "border-green-500 ring-2 ring-green-400"
          : isPopular
          ? "border-indigo-400 ring-1 ring-indigo-300"
          : "border-gray-200"
      }`}
    >
      {isPopular && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Popular
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-green-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Current Plan
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-extrabold text-gray-900">₱{price.toLocaleString()}</span>
          <span className="ml-1 text-xs text-gray-400">{billing === "yearly" ? "/year" : "/month"}</span>
        </div>
        {billing === "yearly" && (
          <p className="text-xs text-indigo-600 font-medium mt-0.5">
            ₱{yearlyMonthly.toLocaleString()}/mo · 2 months free
          </p>
        )}
      </div>

      <ul className="flex-1 space-y-2 mb-5">
        {plan.features &&
          Object.entries(plan.features).map(([k, v]) => (
            <li key={k} className="flex items-center gap-2 text-xs text-gray-600">
              {typeof v === "boolean" && !v ? (
                <span className="text-gray-300">✕</span>
              ) : (
                <span className="text-green-500">✓</span>
              )}
              <span>
                <span className="font-medium">{FEATURE_LABELS[k] || k}:</span>{" "}
                {featureDisplay(v)}
              </span>
            </li>
          ))}
      </ul>

      <button
        disabled={loading}
        onClick={() => onSelect(plan)}
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          isCurrent
            ? "bg-green-600 text-white hover:bg-green-700"
            : isPopular
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"
        } disabled:opacity-50`}
      >
        {loading ? "Processing…" : isCurrent ? "Renew" : "Switch to " + plan.name}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Countdown display
// ---------------------------------------------------------------------------
function CountdownBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl bg-white border border-gray-200 px-4 py-3 min-w-[56px] text-center shadow-sm">
        <span className="text-2xl font-extrabold text-gray-900 tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const SubscriptionPage = () => {
  const { data, isLoading, isError } = useSubscriptionStatus()
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans()
  const checkout = useSubscriptionCheckout()

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [methodModal, setMethodModal] = useState<{
    methods: string[]; checkoutData: CheckoutResponse
  } | null>(null)
  const [paymentReady, setPaymentReady] = useState<{
    checkoutUrl: string; formData: Record<string, string>; selectedMethod: string
  } | null>(null)

  const countdown = useCountdown(data?.subscription?.end_date)

  // Check if we came back from a successful renewal
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("renewed") === "1") {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
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

  if (isLoading || plansLoading) {
    return (
      <SingleColumnPage widgets={{ after: [], before: [] }}>
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
        </div>
      </SingleColumnPage>
    )
  }

  const { has_subscription, subscription } = data || {}
  const plans = plansData?.plans || []
  const expiryDate = subscription?.end_date ? new Date(subscription.end_date) : null
  const isExpiring = expiryDate
    ? (expiryDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <SingleColumnPage widgets={{ after: [], before: [] }}>
      {/* Modals */}
      {methodModal && (
        <MethodModal
          methods={methodModal.methods}
          onSelect={handleMethodSelect}
          onCancel={() => setMethodModal(null)}
        />
      )}
      {paymentReady && (
        <GiyaPayAutoSubmit
          checkoutUrl={paymentReady.checkoutUrl}
          formData={paymentReady.formData}
          selectedMethod={paymentReady.selectedMethod}
          onCancel={() => setPaymentReady(null)}
        />
      )}

      <div className="flex flex-col gap-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your Maretinda vendor subscription. Payments are processed via GiyaPay.
          </p>
        </div>

        {/* Current subscription card */}
        {has_subscription && subscription ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Current Plan</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">{subscription.plan_name}</p>
                <p className="mt-0.5 text-sm text-gray-500 capitalize">
                  {subscription.billing_period || "monthly"} billing
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor(subscription.status)}`}>
                {subscription.status}
              </span>
            </div>

            {/* Countdown */}
            {subscription.end_date && countdown && (
              <div className={`mt-5 rounded-xl p-4 ${isExpiring ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                <p className={`text-xs font-semibold mb-3 ${isExpiring ? "text-red-600" : "text-gray-500"}`}>
                  {isExpiring ? "⚠ Expiring soon — renew now!" : "Subscription expires in"}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <CountdownBox label="Days" value={countdown.days} />
                  <CountdownBox label="Hours" value={countdown.hours} />
                  <CountdownBox label="Mins" value={countdown.minutes} />
                  <CountdownBox label="Secs" value={countdown.seconds} />
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Expires on {formatDate(subscription.end_date)}
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div>
                <p className="text-gray-400">Started</p>
                <p className="font-semibold text-gray-800">{formatDate(subscription.start_date)}</p>
              </div>
              <div>
                <p className="text-gray-400">Price paid</p>
                <p className="font-semibold text-gray-800">₱{subscription.price.toLocaleString()}</p>
              </div>
              {subscription.payment_reference && (
                <div>
                  <p className="text-gray-400">Payment ref</p>
                  <p className="font-mono text-gray-600 break-all">{subscription.payment_reference}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-gray-600">No active subscription</p>
            <p className="mt-1 text-sm text-gray-400">Select a plan below to get started.</p>
          </div>
        )}

        {/* Plan selection */}
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              {has_subscription ? "Renew or Change Plan" : "Choose a Plan"}
            </h2>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  billing === "monthly" ? "bg-indigo-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                  billing === "yearly" ? "bg-indigo-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                  ~17% off
                </span>
              </button>
            </div>
          </div>

          {plans.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billing={billing}
                  currentPlanName={has_subscription ? subscription?.plan_name ?? null : null}
                  onSelect={handleSelectPlan}
                  loading={checkout.isPending}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No plans available.</p>
          )}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Payments are processed securely by <strong>GiyaPay</strong>. After payment, your subscription is activated automatically.
        </div>
      </div>
    </SingleColumnPage>
  )
}

export default SubscriptionPage
