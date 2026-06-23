'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

// ---------------------------------------------------------------------------
// This page is ONLY accessible after a successful GiyaPay subscription payment.
// It gates registration behind a valid payment reference so nobody can
// sign up as a seller without paying first.
// ---------------------------------------------------------------------------

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND ||
  'http://localhost:9000';

// ---------------------------------------------------------------------------
// Payment verification check
// ---------------------------------------------------------------------------

interface VerifyResult {
  valid: boolean;
  plan_name?: string;
  amount?: number;
  reason?: string;
}

async function verifyPayment(ref: string): Promise<VerifyResult> {
  const res = await fetch(
    `${BACKEND_URL}/store/subscription/verify-payment?ref=${encodeURIComponent(ref)}`,
    {
      headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '' },
    }
  );
  return res.json();
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

function RegisterContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const paymentRef = searchParams.get('ref') || '';
  const planSlug = searchParams.get('plan') || '';

  // Page state
  type PageState = 'verifying' | 'verified' | 'invalid' | 'submitting' | 'success' | 'error';
  const [state, setState] = useState<PageState>('verifying');
  const [verifyInfo, setVerifyInfo] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // ── Verify payment on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!paymentRef) {
      setState('invalid');
      setErrorMsg('No payment reference found. Please complete a payment first.');
      return;
    }

    verifyPayment(paymentRef).then((result) => {
      setVerifyInfo(result);
      setState(result.valid ? 'verified' : 'invalid');
      if (!result.valid) {
        setErrorMsg(result.reason || 'Payment reference is invalid or has already been used.');
      }
    }).catch(() => {
      setState('invalid');
      setErrorMsg('Could not verify your payment. Please try again or contact support.');
    });
  }, [paymentRef]);

  // ── Submit registration ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) { setErrorMsg('Store / Company name is required.'); return; }
    if (!email.trim()) { setErrorMsg('Email is required.'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setErrorMsg('Passwords do not match.'); return; }

    setErrorMsg('');
    setState('submitting');

    try {
      const planName = verifyInfo?.plan_name || planSlug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const res = await fetch(`${BACKEND_URL}/store/seller/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          payment_reference: paymentRef,
          plan_name: planName,
        }),
      });

      const data = await res.json() as any;

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
        setState('verified'); // go back to form
        return;
      }

      setState('success');
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setState('verified');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const planDisplayName =
    verifyInfo?.plan_name ||
    planSlug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Loading / verifying
  if (state === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-600">Verifying your payment, please wait…</p>
        </div>
      </div>
    );
  }

  // Invalid payment reference
  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Verification Failed</h2>
          <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
          <button
            onClick={() => {
              const url = process.env.NEXT_PUBLIC_seller_PANEL_URL || '';
              if (url) window.location.href = `${url}/subscription`;
              else router.push(`/${locale}`);
            }}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (state === 'success') {
    const sellerPanelUrl = process.env.NEXT_PUBLIC_seller_PANEL_URL || '';
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
          <p className="text-sm text-gray-600 mb-2">
            Your seller account has been created and your{' '}
            <span className="font-semibold text-indigo-700">{planDisplayName}</span> subscription
            is now active.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Log in to your seller panel with the email and password you just set up.
          </p>
          {sellerPanelUrl ? (
            <a
              href={`${sellerPanelUrl}/login`}
              className="block w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 text-center"
            >
              Go to seller Panel →
            </a>
          ) : (
            <p className="text-xs text-gray-400">
              Visit your seller panel to start selling.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main registration form (state: verified | submitting | error)
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Payment verified badge */}
        <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 mb-6 w-fit mx-auto">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-semibold text-green-700">
            Payment verified — {planDisplayName} Plan
            {verifyInfo?.amount ? ` · ₱${Number(verifyInfo.amount).toLocaleString()}` : ''}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: '#e0e7ff', color: '#4338ca' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              seller Registration
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create your seller account</h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete the form below to activate your store.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store / Company Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Awesome Store"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seller@example.com"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            <button
              type="submit"
              disabled={state === 'submitting'}
              className="mt-1 w-full rounded-xl py-3 text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)' }}
            >
              {state === 'submitting' ? 'Creating account…' : 'Create seller Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <a
              href={process.env.NEXT_PUBLIC_seller_PANEL_URL || '#'}
              className="text-indigo-600 font-medium hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export default function sellerRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
