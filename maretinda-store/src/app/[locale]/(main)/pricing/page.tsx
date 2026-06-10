'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Plan {
  id: string
  name: string
  price: number
  yearly_price: number | null
  features: Record<string, unknown> | null
  status: string
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND ||
  'http://localhost:9000'

const FEATURE_LABELS: Record<string, string> = {
  max_products: 'Products',
  analytics: 'Analytics',
  priority_support: 'Priority Support',
  featured_listings: 'Featured Listings',
  dedicated_manager: 'Dedicated Account Manager',
}

function featureDisplay(key: string, value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === -1) return 'Unlimited'
  if (typeof value === 'string') {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  return String(value)
}

function CheckIcon({ active }: { active: boolean }) {
  if (!active) {
    return (
      <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
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
  const isPopular = plan.name === 'Boost'
  const monthlyPrice = plan.price
  const yearlyPrice = plan.yearly_price ?? plan.price * 10
  const displayPrice = billing === 'yearly' ? yearlyPrice : monthlyPrice
  const yearlyMonthly = Math.round(yearlyPrice / 12)

  const sellerPanelUrl =
    typeof window !== 'undefined'
      ? (window as any).__ENV__?.VITE_seller_PANEL_URL ||
        process.env.NEXT_PUBLIC_seller_PANEL_URL ||
        ''
      : process.env.NEXT_PUBLIC_seller_PANEL_URL || ''

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md ${
        isPopular ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
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
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-3">
          <span className="text-4xl font-extrabold text-gray-900">
            ₱{displayPrice.toLocaleString()}
          </span>
          <span className="ml-1 text-sm text-gray-500">
            {billing === 'yearly' ? '/year' : '/month'}
          </span>
        </div>
        {billing === 'yearly' && (
          <p className="mt-1 text-xs text-indigo-600 font-medium">
            ₱{yearlyMonthly.toLocaleString()}/mo · Save {Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100)}%
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features &&
          Object.entries(plan.features).map(([key, value]) => (
            <li key={key} className="flex items-center gap-3 text-sm">
              <CheckIcon active={typeof value === 'boolean' ? value : true} />
              <span className="text-gray-600">
                <span className="font-medium text-gray-800">{FEATURE_LABELS[key] || key}:</span>{' '}
                {featureDisplay(key, value)}
              </span>
            </li>
          ))}
      </ul>

      <div className="space-y-2">
        <Link
          href={`/${locale}/become-seller?plan=${encodeURIComponent(plan.name)}&billing=${billing}`}
          className={`block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
            isPopular
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          Get Started — {plan.name}
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
            Yearly
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
              Save ~17%
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
