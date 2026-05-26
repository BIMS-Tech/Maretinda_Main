'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';

// ---------------------------------------------------------------------------
// This page handles THREE distinct GiyaPay success flows:
//
//  1. CUSTOMER PRODUCT PURCHASE  — order_id does NOT start with "vsub_" or "vrenew_"
//     → verifies signature + completes cart → redirects to order confirmed
//
//  2. NEW VENDOR SUBSCRIPTION    — order_id starts with "vsub_"
//     → verifies signature + records transaction → redirects to /become-vendor/register
//
//  3. VENDOR SUBSCRIPTION RENEWAL — order_id starts with "vrenew_"
//     → verifies signature + activates renewal → redirects to vendor panel
// ---------------------------------------------------------------------------

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const nonce = searchParams.get('nonce');
        const orderId = searchParams.get('order_id');
        const refno = searchParams.get('refno');
        const timestamp = searchParams.get('timestamp');
        const amount = searchParams.get('amount');
        const signature = searchParams.get('signature');
        const paymentMethod = searchParams.get('payment_method');

        if (!signature || !nonce || !orderId) {
          setStatus('error');
          setMessage('Invalid payment callback. Please contact support.');
          return;
        }

        // ---------------------------------------------------------------
        // FLOW 3: Vendor subscription renewal (from vendor panel)
        // ---------------------------------------------------------------
        if (orderId.startsWith('vrenew_')) {
          setMessage('Verifying renewal payment...');

          // First verify the GiyaPay signature
          const verifyRes = await fetch('/api/subscription/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nonce, order_id: orderId, refno, timestamp, amount, signature }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyData.success) {
            setStatus('error');
            setMessage(verifyData.message || 'Renewal payment verification failed. Please contact support.');
            return;
          }

          setMessage('Activating your subscription...');

          // Activate the subscription on the backend
          const activateRes = await fetch('/api/subscription/activate-renewal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference_number: refno, order_id: orderId }),
          });

          const activateData = await activateRes.json();

          if (!activateData.success) {
            setStatus('error');
            setMessage(activateData.message || 'Failed to activate subscription. Please contact support with reference: ' + refno);
            return;
          }

          setStatus('success');
          setMessage('Subscription renewed! Redirecting to your vendor panel...');

          const vendorPanelUrl =
            (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_VENDOR_PANEL_URL) ||
            process.env.NEXT_PUBLIC_VENDOR_PANEL_URL ||
            '';

          setTimeout(() => {
            if (vendorPanelUrl) {
              window.location.href = `${vendorPanelUrl}/subscription?renewed=1`;
            } else {
              router.push(`/${locale}`);
            }
          }, 1500);

          return;
        }

        // ---------------------------------------------------------------
        // FLOW 2: New vendor subscription payment
        // ---------------------------------------------------------------
        if (orderId.startsWith('vsub_')) {
          setMessage('Verifying subscription payment...');

          // Call our Next.js API route which proxies to backend /giyapay/verify
          const verifyRes = await fetch('/api/subscription/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nonce, order_id: orderId, refno, timestamp, amount, signature }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyData.success) {
            setStatus('error');
            setMessage(verifyData.message || 'Subscription payment verification failed. Please contact support.');
            return;
          }

          // Extract plan slug from order_id: vsub_<slug>_<timestamp>
          const parts = orderId.split('_');
          const planSlug = parts.slice(1, parts.length - 1).join('_');

          setStatus('success');
          setMessage('Payment verified! Setting up your vendor account...');

          // Redirect to the gated vendor registration form
          setTimeout(() => {
            router.push(`/${locale}/become-vendor/register?ref=${refno}&plan=${encodeURIComponent(planSlug)}&order=${encodeURIComponent(orderId)}`);
          }, 1200);

          return;
        }

        // ---------------------------------------------------------------
        // FLOW 1: Regular customer product purchase (unchanged)
        // ---------------------------------------------------------------
        setMessage('Verifying payment with GiyaPay...');

        let selectedMethod = paymentMethod;
        if (!selectedMethod && typeof window !== 'undefined') {
          selectedMethod = localStorage.getItem('giyapay_selected_method') || 'GIYAPAY';
          localStorage.removeItem('giyapay_selected_method');
        }

        const response = await fetch('/api/giyapay/complete-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nonce,
            order_id: orderId,
            refno,
            timestamp,
            amount,
            signature,
            payment_method: selectedMethod,
          }),
        });

        const data = await response.json();

        if (data.success && data.order_id) {
          setStatus('success');
          setMessage('Payment verified! Redirecting to your order...');
          setTimeout(() => {
            router.push(`/${locale}/order/${data.order_id}/confirmed`);
          }, 1500);
        } else {
          setStatus('error');
          setMessage(data.message || 'Payment verification failed. Please contact support with reference: ' + refno);
        }
      } catch (error) {
        console.error('[GiyaPay Success] Error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment. Please contact support.');
      }
    };

    handleCallback();
  }, [searchParams, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full h-16 w-16 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full h-16 w-16 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => router.push(`/${locale}/become-vendor`)}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GiyaPaySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
