'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Plan {
  id: string
  name: string
  price: number
  yearly_price: number | null
  yearly_discount_percent: number | null
  trial_days: number
  features: Record<string, unknown> | null
  status: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND ||
  'http://localhost:9000'

const PLAN_META: Record<string, { tier: string; tagline: string }> = {
  Starter: { tier: 'STARTER', tagline: 'Perfect to get started' },
  Growth:  { tier: 'GROWTH',  tagline: 'For scaling businesses' },
  Premium: { tier: 'PREMIUM', tagline: 'For high-volume brands' },
}

function buildFeatureList(features: Record<string, unknown>): { label: string; state: 'included' | 'excluded' | 'coming_soon' }[] {
  const rows: { label: string; state: 'included' | 'excluded' | 'coming_soon' }[] = []
  const p = features.max_products
  rows.push({ label: p === -1 ? 'Unlimited products' : `Up to ${p} products`, state: 'included' })
  const a = features.analytics as string
  rows.push({ label: a === 'basic' ? 'Basic analytics dashboard' : a === 'advanced' ? 'Advanced analytics & reports' : 'Full analytics suite + exports', state: 'included' })
  rows.push({ label: 'Standard storefront', state: 'included' })
  const s = features.staff_accounts as number
  rows.push({ label: s === 1 ? '1 staff account' : `${s} staff accounts`, state: 'included' })
  rows.push({ label: 'GiyaPay payments', state: 'included' })
  const inv = features.inventory as string
  rows.push({ label: inv === 'standard' ? 'Inventory management' : inv === 'smart' ? 'Smart inventory + alerts' : 'Advanced inventory + forecasting', state: 'included' })
  const sup = features.support as string
  rows.push({ label: sup === 'email' ? 'Email support' : sup === 'priority' ? 'Priority email & live chat' : 'Dedicated account manager', state: 'included' })
  rows.push({ label: 'Flash sales & vouchers', state: features.flash_sales ? 'included' : 'excluded' })
  rows.push({ label: 'Subscription products', state: features.subscription_products ? 'included' : 'excluded' })
  if (features.dedicated_manager === true) rows.push({ label: 'Dedicated account manager', state: 'included' })
  if (features.sla === true) rows.push({ label: '99.9% SLA guarantee', state: 'included' })
  const m = features.model_3d
  rows.push({ label: '3D Model Generation', state: m === 'coming_soon' ? 'coming_soon' : m ? 'included' : 'excluded' })
  return rows
}

function PlanCard({
  plan,
  billing,
  locale,
}: {
  plan: Plan
  billing: 'monthly' | 'yearly'
  locale: string
}) {
  const isPopular = plan.name === 'Growth'
  const monthlyPrice = plan.price
  const yearlyPrice = plan.yearly_price ?? Math.round(plan.price * 12 * 0.83)
  const displayPrice = billing === 'yearly' ? Math.round(yearlyPrice / 12) : monthlyPrice
  const yearlyTotal = billing === 'yearly' ? yearlyPrice : null
  const discountPct = plan.yearly_discount_percent ?? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)
  const yearlyMonthly = Math.round(yearlyPrice / 12)

  const sellerPanelUrl =
    typeof window !== 'undefined'
      ? (window as any).__ENV__?.VITE_seller_PANEL_URL ||
        process.env.NEXT_PUBLIC_seller_PANEL_URL ||
        ''
      : process.env.NEXT_PUBLIC_seller_PANEL_URL || ''

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
        isPopular
          ? 'bg-gradient-to-b from-[#2d1f5e] to-[#1a1030] border-violet-500/40 shadow-violet-900/20 shadow-lg'
          : 'bg-white border-gray-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        {(() => { const meta = PLAN_META[plan.name]; return meta ? (
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-1">{meta.tier}</p>
        ) : null })()}
        <h3 className={`text-2xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
        <p className={`text-sm mt-0.5 ${isPopular ? 'text-indigo-200' : 'text-gray-400'}`}>
          {PLAN_META[plan.name]?.tagline ?? ''}
        </p>
        <div className="mt-4">
          <div className="flex items-end gap-1">
            <span className={`text-[11px] font-bold -mb-0.5 ${isPopular ? 'text-amber-400' : 'text-indigo-500'}`}>₱</span>
            <span className={`text-4xl font-extrabold tabular-nums ${isPopular ? 'text-white' : 'text-gray-900'}`}>
              {displayPrice.toLocaleString()}
            </span>
            <span className={`text-sm mb-0.5 ml-1 ${isPopular ? 'text-indigo-200' : 'text-gray-400'}`}>/mo</span>
          </div>
          {billing === 'yearly' && yearlyTotal && (
            <p className={`mt-1 text-xs font-medium ${isPopular ? 'text-amber-300' : 'text-indigo-500'}`}>
              Billed ₱{yearlyTotal.toLocaleString()}/year · Save {discountPct}%
            </p>
          )}
          {plan.trial_days > 0 && billing === 'monthly' && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5">
              <span className="text-[10px] text-indigo-600 font-semibold">{plan.trial_days}-day free trial</span>
            </div>
          )}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-2.5">
        {plan.features && buildFeatureList(plan.features).map((f, i) => {
          if (f.state === 'coming_soon') {
            return (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className={`text-amber-500 text-base flex-shrink-0`}>◑</span>
                <span className={isPopular ? 'text-indigo-100' : 'text-gray-600'}>{f.label}</span>
                <span className="ml-auto rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 uppercase tracking-wider">Soon</span>
              </li>
            )
          }
          if (f.state === 'excluded') {
            return (
              <li key={i} className={`flex items-center gap-3 text-sm ${isPopular ? 'text-indigo-300/40' : 'text-gray-300'}`}>
                <span className="text-base flex-shrink-0">—</span>
                <span className="line-through">{f.label}</span>
              </li>
            )
          }
          return (
            <li key={i} className="flex items-center gap-3 text-sm">
              <svg className="h-4 w-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className={isPopular ? 'text-indigo-100' : 'text-gray-600'}>{f.label}</span>
            </li>
          )
        })}
      </ul>

      <div className="space-y-2">
        <Link
          href={`/${locale}/become-vendor?plan=${encodeURIComponent(plan.name)}&billing=${billing}`}
          className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
            isPopular
              ? 'bg-amber-400 text-gray-900 hover:bg-amber-300 font-extrabold'
              : plan.name === 'Premium'
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {isPopular ? 'Start Growing Now →' : plan.name === 'Premium' ? 'Contact Sales →' : 'Get Started Free →'}
        </Link>
        {sellerPanelUrl && (
          <a
            href={`${sellerPanelUrl}/subscription?plan=${encodeURIComponent(plan.name)}&billing=${billing}`}
            className="block w-full rounded-xl border border-gray-300 px-4 py-2 text-center text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Already a seller? Renew here →
          </a>
        )}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    fetch(`${BACKEND_URL}/store/subscription/plans`, {
      headers: {
        'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
    })
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero */}
      <div className="mx-auto max-w-4xl px-4 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          seller Plans
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          No commissions. No hidden fees. Just a flat subscription to keep your store running.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setBilling('monthly')}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              billing === 'monthly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              billing === 'yearly'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-5xl px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} billing={billing} locale={locale} />
            ))}
          </div>
        )}

        {/* FAQ callout */}
        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Questions?</h3>
          <p className="mt-2 text-sm text-gray-500">
            All plans include a 1-month validity. Upgrade, downgrade, or renew at any time from your seller panel.
          </p>
          <p className="mt-3 text-sm text-gray-400">
            Payment is processed securely by{' '}
            <span className="font-semibold text-gray-600">GiyaPay</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
