'use client'

import { useEffect, useRef, useState } from "react"
import { SingleColumnPage } from "../../components/layout/pages"
import {
  useSubscriptionStatus,
  useSubscriptionPlans,
  useSubscriptionCheckout,
  useActivateSubscription,
  type SubscriptionPlan,
  type CheckoutResponse,
  type ActivateResponse,
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
// Plan change type
// ---------------------------------------------------------------------------
type PlanChangeType = "subscribe" | "renew" | "upgrade" | "downgrade"

function getPlanChangeType(plan: SubscriptionPlan, currentPlanName: string | null, plans: SubscriptionPlan[]): PlanChangeType {
  if (!currentPlanName) return "subscribe"
  if (plan.name === currentPlanName) return "renew"
  const currentPlan = plans.find(p => p.name === currentPlanName)
  if (!currentPlan) return "subscribe"
  return plan.price > currentPlan.price ? "upgrade" : "downgrade"
}

function planChangeLabel(type: PlanChangeType, planName: string): string {
  switch (type) {
    case "subscribe": return `Get ${planName}`
    case "renew": return "Renew Plan"
    case "upgrade": return `Upgrade to ${planName}`
    case "downgrade": return `Downgrade to ${planName}`
  }
}

function planChangeBtnStyle(type: PlanChangeType, isCurrent: boolean): string {
  if (isCurrent) return "bg-green-600 text-white hover:bg-green-700"
  if (type === "upgrade") return "bg-indigo-600 text-white hover:bg-indigo-700"
  if (type === "downgrade") return "border border-orange-500 text-orange-600 hover:bg-orange-50"
  return "bg-indigo-600 text-white hover:bg-indigo-700"
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
// Downgrade confirmation modal
// ---------------------------------------------------------------------------
function DowngradeModal({
  planName,
  currentPlanName,
  onConfirm,
  onCancel,
}: {
  planName: string
  currentPlanName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
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
          You are downgrading from <strong>{currentPlanName}</strong> to <strong>{planName}</strong>.
          Your current subscription will be replaced immediately. Some features may no longer be available.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Yes, Downgrade
          </button>
        </div>
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
  allPlans,
  onSelect,
  loading,
}: {
  plan: SubscriptionPlan
  billing: "monthly" | "yearly"
  currentPlanName: string | null
  allPlans: SubscriptionPlan[]
  onSelect: (plan: SubscriptionPlan) => void
  loading: boolean
}) {
  const isCurrent = plan.name === currentPlanName
  const isPopular = plan.name === "Boost"
  const changeType = getPlanChangeType(plan, currentPlanName, allPlans)
  const price = billing === "yearly" ? (plan.yearly_price ?? plan.price * 10) : plan.price
  const yearlyMonthly = plan.yearly_price ? Math.round(plan.yearly_price / 12) : Math.round(plan.price * 10 / 12)

  const borderClass = isCurrent
    ? "border-green-500 ring-2 ring-green-400"
    : changeType === "upgrade"
    ? "border-indigo-400 ring-1 ring-indigo-300"
    : changeType === "downgrade"
    ? "border-orange-300"
    : isPopular
    ? "border-indigo-400 ring-1 ring-indigo-300"
    : "border-gray-200"

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${borderClass}`}>
      {isPopular && !isCurrent && changeType !== "downgrade" && (
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
      {!isCurrent && changeType === "upgrade" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-indigo-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Upgrade
          </span>
        </div>
      )}
      {!isCurrent && changeType === "downgrade" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-orange-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Downgrade
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
        className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${planChangeBtnStyle(changeType, isCurrent)}`}
      >
        {loading ? "Processing…" : planChangeLabel(changeType, plan.name)}
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
// Payment result banners
// ---------------------------------------------------------------------------
type PaymentState = "idle" | "verifying" | "success" | "error" | "cancelled"

function PaymentResultBanner({
  state,
  result,
  onDismiss,
}: {
  state: PaymentState
  result: ActivateResponse | null
  onDismiss: () => void
}) {
  if (state === "verifying") {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 flex items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Verifying your payment…</p>
          <p className="text-xs text-indigo-600 mt-0.5">Please wait while we activate your subscription.</p>
        </div>
      </div>
    )
  }

  if (state === "success" && result) {
    const sub = result.subscription
    const plan = result.plan
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-green-800">
              {result.already_activated ? "Subscription Already Active" : "Subscription Activated!"}
            </p>
            <p className="text-sm text-green-700 mt-1">
              Welcome to the <strong>{plan?.name || sub.plan_name}</strong> plan!
              {sub.end_date ? ` Your subscription is active until ${formatDate(sub.end_date)}.` : ""}
            </p>
            {sub.payment_reference && (
              <p className="text-xs text-green-600 mt-1 font-mono">
                Payment ref: {sub.payment_reference}
              </p>
            )}
          </div>
          <button onClick={onDismiss} className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0">
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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-red-800">Payment Failed</p>
            <p className="text-sm text-red-600 mt-1">
              We could not process your payment. No charges were made. Please try again or contact support.
            </p>
          </div>
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (state === "cancelled") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-gray-800">Payment Cancelled</p>
            <p className="text-sm text-gray-600 mt-1">
              Your payment was cancelled. No charges were made. Select a plan below to try again.
            </p>
          </div>
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export const SubscriptionPage = () => {
  const { data, isLoading, isError } = useSubscriptionStatus()
  const { data: plansData, isLoading: plansLoading } = useSubscriptionPlans()
  const checkout = useSubscriptionCheckout()
  const activate = useActivateSubscription()

  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [methodModal, setMethodModal] = useState<{
    methods: string[]; checkoutData: CheckoutResponse
  } | null>(null)
  const [paymentReady, setPaymentReady] = useState<{
    checkoutUrl: string; formData: Record<string, string>; selectedMethod: string
  } | null>(null)
  const [downgradeModal, setDowngradeModal] = useState<SubscriptionPlan | null>(null)

  const [paymentState, setPaymentState] = useState<PaymentState>("idle")
  const [paymentResult, setPaymentResult] = useState<ActivateResponse | null>(null)

  const countdown = useCountdown(data?.subscription?.end_date)

  // On mount: detect GiyaPay callback params in URL
  useEffect(() => {
    if (typeof window === "undefined") return

    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)

    // Clean the URL immediately so refreshing doesn't re-trigger
    window.history.replaceState({}, "", window.location.pathname)

    if (hash === "#payment-error") {
      setPaymentState("error")
      return
    }

    if (hash === "#payment-cancelled") {
      setPaymentState("cancelled")
      return
    }

    // Success callback: GiyaPay appends nonce, order_id, refno, timestamp, amount, signature
    const signature = params.get("signature")
    const order_id = params.get("order_id")
    const refno = params.get("refno")
    const nonce = params.get("nonce")
    const timestamp = params.get("timestamp")
    const amount = params.get("amount")

    if (signature && order_id && String(order_id).startsWith("vrenew_") && refno && nonce && timestamp && amount) {
      setPaymentState("verifying")
      activate.mutate(
        { order_id, refno, nonce, timestamp, amount, signature },
        {
          onSuccess: (result) => {
            setPaymentResult(result)
            setPaymentState("success")
          },
          onError: () => {
            setPaymentState("error")
          },
        }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    const plans = plansData?.plans || []
    const changeType = getPlanChangeType(plan, data?.subscription?.plan_name ?? null, plans)

    if (changeType === "downgrade") {
      setDowngradeModal(plan)
      return
    }

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
      {downgradeModal && (
        <DowngradeModal
          planName={downgradeModal.name}
          currentPlanName={subscription?.plan_name || ""}
          onConfirm={() => {
            const plan = downgradeModal
            setDowngradeModal(null)
            initiateCheckout(plan)
          }}
          onCancel={() => setDowngradeModal(null)}
        />
      )}

      <div className="flex flex-col gap-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="mt-1 text-sm text-gray-500">
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

          {/* Plan change legend */}
          {has_subscription && (
            <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                Current Plan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                Upgrade (activates immediately)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                Downgrade (requires confirmation)
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
                  currentPlanName={has_subscription ? subscription?.plan_name ?? null : null}
                  allPlans={plans}
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
