'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CancelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'cancelled'>('processing');

  useEffect(() => {
    const handleCancellation = async () => {
      try {
        const orderId = searchParams.get('order_id');
        
        if (orderId) {
          // Call backend to cancel the order
          await fetch('/api/giyapay/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId }),
          });
        }
        
        setStatus('cancelled');
      } catch (error) {
        console.error('Error cancelling order:', error);
        setStatus('cancelled');
      }
    };

    handleCancellation();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="rounded-full h-16 w-16 bg-orange-100 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="h-10 w-10 text-orange-600"
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
            Order Cancelled
          </h2>
          <p className="text-gray-600 mb-6">
            You have cancelled the payment. Your order has been cancelled and no charges were made.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Return to Checkout
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiyaPayCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}


