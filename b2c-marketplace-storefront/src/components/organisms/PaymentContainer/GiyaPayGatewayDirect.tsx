'use client';

import { useEffect, useState, useRef } from 'react';
import { RadioGroup } from '@headlessui/react';
import { Radio } from '@medusajs/ui';
import Image from 'next/image';

interface GiyaPayGatewayDirectProps {
  paymentSession?: any;
  selectedPaymentOptionId: string;
  onSelectMethod?: (method: string) => void;
}

const GiyaPayGatewayDirect = ({
  paymentSession,
  selectedPaymentOptionId,
  onSelectMethod,
}: GiyaPayGatewayDirectProps) => {
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const formRefs = useRef<{ [key: string]: HTMLFormElement | null }>({});

  // Get enabled payment methods from payment session data
  useEffect(() => {
    const sessionData = paymentSession?.data;
    if (sessionData?.enabled_methods && Array.isArray(sessionData.enabled_methods)) {
      console.log('[GiyaPay] Enabled methods from session:', sessionData.enabled_methods);
      setEnabledMethods(sessionData.enabled_methods);
    } else {
      // Default to all methods if not specified
      console.log('[GiyaPay] No enabled methods in session, using defaults');
      setEnabledMethods(['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA']);
    }
  }, [paymentSession]);

  // Clear selected method from localStorage when component unmounts or GiyaPay is deselected
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && !selectedPaymentOptionId) {
        localStorage.removeItem('giyapay_selected_method');
      }
    };
  }, [selectedPaymentOptionId]);

  const paymentMethodConfig = {
    'MASTERCARD/VISA': {
      title: 'VISA',
      description: 'Pay with Visa or Mastercard',
      buttonImage: 'https://pay.giyapay.com/images/btn-mastercard-visa.png',
      icon: (
        <div className="flex items-center justify-center" style={{ width: '48px', height: '32px' }}>
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#1434CB"/>
            <text x="24" y="20" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">VISA</text>
          </svg>
        </div>
      ),
    },
    'GCASH': {
      title: 'GCash',
      description: 'Pay with GCash e-wallet',
      buttonImage: 'https://pay.giyapay.com/images/btn-gcash.png',
      icon: (
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none"/>
            <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">G</text>
          </svg>
        </div>
      ),
    },
    'INSTAPAY': {
      title: 'InstaPay',
      description: 'Bank transfer via InstaPay',
      buttonImage: 'https://pay.giyapay.com/images/btn-instapay.png',
      icon: (
        <div className="flex items-center justify-center" style={{ width: '64px', height: '32px' }}>
          <div className="w-full h-full bg-green-600 rounded flex items-center justify-center px-2">
            <span className="text-white font-bold text-xs">InstaPay</span>
          </div>
        </div>
      ),
    },
    'PAYMAYA': {
      title: 'PayMaya',
      description: 'Pay with PayMaya e-wallet',
      buttonImage: 'https://pay.giyapay.com/images/btn-paymaya.png',
      icon: (
        <div className="flex items-center justify-center" style={{ width: '64px', height: '32px' }}>
          <div className="w-full h-full bg-green-500 rounded flex items-center justify-center px-2">
            <span className="text-white font-bold text-xs">PayMaya</span>
          </div>
        </div>
      ),
    },
    'UNIONPAY': {
      title: 'Union Pay',
      description: 'Pay with UnionPay',
      buttonImage: '',
      icon: (
        <div className="flex items-center justify-center" style={{ width: '48px', height: '32px' }}>
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#E21836"/>
            <text x="24" y="20" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">UnionPay</text>
          </svg>
        </div>
      ),
    },
    'GRAB': {
      title: 'Grab',
      description: 'Pay with Grab',
      buttonImage: '',
      icon: (
        <div className="flex items-center justify-center" style={{ width: '48px', height: '32px' }}>
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#00B14F"/>
            <text x="24" y="20" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">Grab</text>
          </svg>
        </div>
      ),
    },
    'QRPH': {
      title: 'QR Ph',
      description: 'Pay with QR Ph',
      buttonImage: '',
      icon: (
        <div className="flex items-center justify-center" style={{ width: '48px', height: '32px' }}>
          <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
            <text x="16" y="20" textAnchor="middle" fontSize="9" fill="#EF4444" fontWeight="bold" fontFamily="Arial, sans-serif">QR</text>
            <text x="32" y="20" textAnchor="middle" fontSize="9" fill="#F59E0B" fontWeight="bold" fontFamily="Arial, sans-serif">Ph</text>
          </svg>
        </div>
      ),
    },
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    // Store selected method in localStorage so the main "Pay with GiyaPay" button can use it
    if (typeof window !== 'undefined') {
      localStorage.setItem('giyapay_selected_method', method);
    }
    if (onSelectMethod) {
      onSelectMethod(method);
    }
  };

  // Payment session data is in paymentSession.data
  const sessionData = paymentSession?.data;
  
  // Debug logging
  console.log('[GiyaPay] Payment session:', paymentSession);
  console.log('[GiyaPay] Session data:', sessionData);
  
  if (!paymentSession) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-x-4">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
          <div className="flex items-center justify-center w-16 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-md px-2">
            <span className="text-white font-bold text-xs">GiyaPay</span>
          </div>
          <span className="font-semibold text-gray-900">GiyaPay</span>
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-9">
          Initializing payment session...
        </p>
      </div>
    );
  }
  
  if (!sessionData || !sessionData.form_data) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-x-4">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
          <div className="flex items-center justify-center w-16 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-md px-2">
            <span className="text-white font-bold text-xs">GiyaPay</span>
          </div>
          <span className="font-semibold text-gray-900">GiyaPay</span>
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-9">
          Loading payment options...
        </p>
      </div>
    );
  }

  const formData = sessionData.form_data;
  const checkoutUrl = sessionData.checkout_url || 
    (sessionData.sandbox_mode ? 'https://sandbox.giyapay.com/checkout' : 'https://pay.giyapay.com/checkout');

  return (
    <div className="mt-0 -mx-5 -mb-5">
      <div className="space-y-0">
        {enabledMethods.map((method, index) => {
          const config = paymentMethodConfig[method as keyof typeof paymentMethodConfig];
          if (!config) return null;

          const isSelected = selectedMethod === method;

          return (
            <div key={method}>
              <button
                type="button"
                onClick={() => handleMethodSelect(method)}
                className={`w-full flex items-center gap-x-4 px-5 py-5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-600' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center justify-center">
                  {config.icon}
                </div>
                <span className="text-base font-semibold flex-1 text-left" style={{ color: '#111827' }}>
                  {config.title}
                </span>
              </button>

              {/* Hidden form for this payment method */}
              <form
                ref={(el) => {
                  formRefs.current[method] = el;
                }}
                action={checkoutUrl}
                method="post"
                style={{ display: 'none' }}
              >
                <input type="hidden" name="success_callback" value={formData.success_callback} />
                <input type="hidden" name="error_callback" value={formData.error_callback} />
                <input type="hidden" name="cancel_callback" value={formData.cancel_callback} />
                <input type="hidden" name="merchant_id" value={formData.merchant_id} />
                <input type="hidden" name="amount" value={formData.amount} />
                <input type="hidden" name="currency" value={formData.currency} />
                <input type="hidden" name="nonce" value={formData.nonce} />
                <input type="hidden" name="timestamp" value={formData.timestamp} />
                <input type="hidden" name="description" value={formData.description} />
                <input type="hidden" name="signature" value={formData.signature} />
                <input type="hidden" name="payment_method" value={method} />
                <input type="hidden" name="order_id" value={formData.order_id} />
                {formData.customer_email && (
                  <input type="hidden" name="customer_email" value={formData.customer_email} />
                )}
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GiyaPayGatewayDirect;

