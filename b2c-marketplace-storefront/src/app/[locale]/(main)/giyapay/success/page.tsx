'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndCompleteOrder = async () => {
      try {
        // Get callback parameters from GiyaPay
        const nonce = searchParams.get('nonce');
        const callbackOrderId = searchParams.get('order_id');
        const refno = searchParams.get('refno');
        const timestamp = searchParams.get('timestamp');
        const amount = searchParams.get('amount');
        const signature = searchParams.get('signature');
        const paymentMethod = searchParams.get('payment_method'); // GiyaPay may pass this back

        if (!signature || !nonce) {
          setStatus('error');
          setMessage('Invalid payment callback. Please contact support.');
          return;
        }

        setMessage('Verifying payment with GiyaPay...');

        // Get payment method from localStorage as fallback (set when user selected it)
        let selectedMethod = paymentMethod;
        if (!selectedMethod && typeof window !== 'undefined') {
          selectedMethod = localStorage.getItem('giyapay_selected_method') || 'GIYAPAY';
          // Clean up
          localStorage.removeItem('giyapay_selected_method');
        }

        // Verify signature and complete order on backend
        const response = await fetch('/api/giyapay/complete-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nonce,
            order_id: callbackOrderId,
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
          setOrderId(data.order_id);
          setMessage('Payment verified! Redirecting to your order...');
          
          // Redirect to order confirmation page
          // Format: /order/{orderId}/confirmed (mercur format)
          setTimeout(() => {
            router.push(`/order/${data.order_id}/confirmed`);
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Payment verification failed. Please contact support with reference: ' + refno);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment. Please contact support.');
      }
    };

    verifyAndCompleteOrder();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Payment
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full h-16 w-16 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full h-16 w-16 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="h-10 w-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => router.push('/checkout')}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Checkout
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

