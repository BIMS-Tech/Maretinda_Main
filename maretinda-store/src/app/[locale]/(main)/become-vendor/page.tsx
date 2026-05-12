'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Plan {
  id: string;
  name: string;
  price: number;
  features: Record<string, unknown> | null;
  status: string;
}

interface GiyaPayFormData {
  merchant_id: string;
  order_id: string;
  amount: string;
  currency: string;
  description: string;
  nonce: string;
  timestamp: string;
  signature: string;
  success_callback: string;
  error_callback: string;
  cancel_callback: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND ||
  'http://localhost:9000';

function featureLabel(key: string, value: unknown): string {
  const v =
    typeof value === 'boolean'
      ? value ? '✓' : '✗'
      : value === -1
      ? 'Unlimited'
      : String(value);
  return `${key.replace(/_/g, ' ')}: ${v}`;
}

// ---------------------------------------------------------------------------
// GiyaPay auto-submit form (renders a hidden form and submits it)
// ---------------------------------------------------------------------------

function GiyaPayAutoSubmit({
  checkoutUrl,
  formData,
  enabledMethods,
  selectedMethod,
  onCancel,
}: {
  checkoutUrl: string;
  formData: GiyaPayFormData;
  enabledMethods: string[];
  selectedMethod: string;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Auto-submit after a short tick so the DOM is ready
    const timer = setTimeout(() => formRef.current?.submit(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-600 border-t-transparent mx-auto mb-5" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Redirecting to GiyaPay</h3>
        <p className="text-sm text-gray-500 mb-6">
          You will be redirected to the secure payment gateway to complete your subscription.
        </p>
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 underline hover:text-gray-600"
        >
          Cancel
        </button>

        {/* Hidden form — auto-submitted above */}
        <form ref={formRef} method="POST" action={checkoutUrl} className="hidden">
          {Object.entries(formData).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input type="hidden" name="payment_method" value={selectedMethod} />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment method selector modal
// ---------------------------------------------------------------------------

function PaymentMethodModal({
  methods,
  planName,
  onSelect,
  onCancel,
}: {
  methods: string[];
  planName: string;
  onSelect: (method: string) => void;
  onCancel: () => void;
}) {
  const icons: Record<string, string> = {
    GCASH: '💙',
    INSTAPAY: '🏦',
    'MASTERCARD/VISA': '💳',
    PAYMAYA: '💚',
    QRPH: '📱',
    WECHATPAY: '🟢',
    UNIONPAY: '🔴',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Choose Payment Method</h3>
        <p className="text-sm text-gray-500 mb-6">
          Subscribing to <span className="font-semibold text-indigo-700">{planName}</span>
        </p>
        <div className="flex flex-col gap-3">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => onSelect(m)}
              className="flex items-center gap-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <span className="text-2xl">{icons[m] ?? '💳'}</span>
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="mt-5 w-full text-sm text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  onBuy,
  loading,
}: {
  plan: Plan;
  onBuy: (plan: Plan) => void;
  loading: boolean;
}) {
  const features = plan.features as Record<string, unknown> | null;
  const isPopular = plan.name === 'Boost';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 transition-shadow hover:shadow-xl ${
        isPopular
          ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/30'
          : 'border-gray-200 bg-white'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-extrabold text-gray-900">
          ₱{plan.price.toLocaleString()}
        </span>
        <span className="mb-1 text-sm text-gray-500">/mo</span>
      </div>

      {features && (
        <ul className="mt-5 flex-1 space-y-2 text-sm text-gray-600">
          {Object.entries(features).map(([k, v]) => (
            <li key={k} className="flex items-start gap-2">
              <span
                className={`mt-0.5 text-base ${
                  typeof v === 'boolean' && !v ? 'text-gray-300' : 'text-green-500'
                }`}
              >
                {typeof v === 'boolean' && !v ? '✗' : '✓'}
              </span>
              <span className="capitalize">{featureLabel(k, v)}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => onBuy(plan)}
        disabled={loading}
        className={`mt-7 w-full rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-60 ${
          isPopular
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
      >
        {loading ? 'Processing…' : `Get ${plan.name}`}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BecomeVendorPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  // Payment flow state
  const [methodModal, setMethodModal] = useState<{ plan: Plan; methods: string[] } | null>(null);
  const [paymentReady, setPaymentReady] = useState<{
    checkoutUrl: string;
    formData: GiyaPayFormData;
    methods: string[];
    selectedMethod: string;
  } | null>(null);

  // Load plans on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/store/subscription/plans`, {
      headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '' },
    })
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .catch(() => setError('Failed to load plans. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  // Step 1: User clicks "Get Plan" → fetch GiyaPay form data from backend
  const handleBuy = async (plan: Plan) => {
    setInitiating(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/store/subscription/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({ plan_name: plan.name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Failed to initiate payment');
      }

      const data = await res.json();

      // Step 2: Show payment method selector
      setMethodModal({ plan, methods: data.enabled_methods || ['GCASH'] });
      // Stash payment data for use after method selection
      (window as any).__giyapayPending = data;
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setInitiating(false);
    }
  };

  // Step 3: User selects payment method → show GiyaPay auto-submit form
  const handleMethodSelect = (method: string) => {
    const pending = (window as any).__giyapayPending;
    if (!pending) return;

    // Store selected method in localStorage so success page can read it
    if (typeof window !== 'undefined') {
      localStorage.setItem('giyapay_selected_method', method);
    }

    setMethodModal(null);
    setPaymentReady({
      checkoutUrl: pending.checkout_url,
      formData: pending.form_data,
      methods: pending.enabled_methods,
      selectedMethod: method,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Modals */}
      {methodModal && (
        <PaymentMethodModal
          methods={methodModal.methods}
          planName={methodModal.plan.name}
          onSelect={handleMethodSelect}
          onCancel={() => { setMethodModal(null); delete (window as any).__giyapayPending; }}
        />
      )}

      {paymentReady && (
        <GiyaPayAutoSubmit
          checkoutUrl={paymentReady.checkoutUrl}
          formData={paymentReady.formData}
          enabledMethods={paymentReady.methods}
          selectedMethod={paymentReady.selectedMethod}
          onCancel={() => setPaymentReady(null)}
        />
      )}

      {/* Hero */}
      <div className="mx-auto max-w-4xl px-4 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Vendor Subscriptions
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Start Selling on Maretinda
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Choose the plan that fits your business. Pay once, get your store live in minutes.
          No commissions — just a flat monthly subscription.
        </p>

        {/* Steps */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          {[
            { n: '1', label: 'Choose a plan' },
            { n: '2', label: 'Pay via GiyaPay' },
            { n: '3', label: 'Create your vendor account' },
            { n: '4', label: 'Start selling immediately' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {n}
              </span>
              <span>{label}</span>
              {n !== '4' && <span className="text-gray-300 hidden sm:inline">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-5xl px-4 pb-24">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 text-center mb-6">
            {error}
          </div>
        )}

        {!loading && plans.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onBuy={handleBuy}
                loading={initiating}
              />
            ))}
          </div>
        )}

        {/* Already a vendor link */}
        <p className="mt-12 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a
            href={process.env.NEXT_PUBLIC_VENDOR_PANEL_URL || '#'}
            className="text-indigo-600 font-medium hover:underline"
          >
            Log in to your vendor panel →
          </a>
        </p>
      </div>
    </div>
  );
}
