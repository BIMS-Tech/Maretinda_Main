'use client';

import { RadioGroup } from '@headlessui/react';
import { useEffect, useRef } from 'react';
import { paymentInfoMap } from '@/lib/constants';

interface GiyaPayContainerProps {
  paymentProviderId: string;
  selectedPaymentOptionId: string;
  paymentSession?: any;
}

const GiyaPayContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentSession,
}: GiyaPayContainerProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const isSelected = selectedPaymentOptionId === paymentProviderId;
  
  const paymentInfo = paymentInfoMap[paymentProviderId];
  
  // Get payment method for GiyaPay API
  const getGiyaPayMethod = (providerId: string): string => {
    if (providerId.includes('instapay')) return 'INSTAPAY';
    if (providerId.includes('gcash')) return 'GCASH';
    if (providerId.includes('paymaya')) return 'PAYMAYA';
    if (providerId.includes('visa') || providerId.includes('mastercard')) return 'MASTERCARD/VISA';
    return 'GCASH';
  };

  // Get button image for payment method
  const getButtonImage = (providerId: string): string => {
    if (providerId.includes('instapay')) return 'https://pay.giyapay.com/images/btn-instapay.png';
    if (providerId.includes('gcash')) return 'https://pay.giyapay.com/images/btn-gcash.png';
    if (providerId.includes('paymaya')) return 'https://pay.giyapay.com/images/btn-paymaya.png';
    if (providerId.includes('visa') || providerId.includes('mastercard')) return 'https://pay.giyapay.com/images/btn-mastercard-visa.png';
    return 'https://pay.giyapay.com/images/btn-gcash.png';
  };

  const handlePayment = () => {
    if (formRef.current && paymentSession?.session_data) {
      // Submit the form to GiyaPay
      formRef.current.submit();
    }
  };

  // Auto-submit when this payment method is selected and we have session data
  useEffect(() => {
    if (isSelected && paymentSession?.session_data && formRef.current) {
      // Small delay to ensure UI updates
      setTimeout(() => {
        handlePayment();
      }, 100);
    }
  }, [isSelected, paymentSession]);

  if (!paymentSession?.session_data) {
    return (
      <RadioGroup.Option
        value={paymentProviderId}
        className={({ checked }) =>
          `${
            checked ? 'border-ui-border-interactive' : 'border-ui-border-base'
          } flex cursor-pointer items-center gap-x-3 border p-4 transition-all duration-200 ease-in-out hover:shadow-borders-interactive-with-shadow`
        }
      >
        <RadioGroup.Label className="flex flex-1 basis-0 items-center gap-x-3">
          {paymentInfo?.icon}
          <span className="text-base-regular">{paymentInfo?.title}</span>
        </RadioGroup.Label>
      </RadioGroup.Option>
    );
  }

  const sessionData = paymentSession.session_data;
  const giyaPayUrl = sessionData.sandbox_mode 
    ? 'https://sandbox.giyapay.com/checkout'
    : 'https://giyapay.com/checkout';

  return (
    <>
      <RadioGroup.Option
        value={paymentProviderId}
        className={({ checked }) =>
          `${
            checked ? 'border-ui-border-interactive' : 'border-ui-border-base'
          } flex cursor-pointer items-center gap-x-3 border p-4 transition-all duration-200 ease-in-out hover:shadow-borders-interactive-with-shadow`
        }
      >
        <RadioGroup.Label className="flex flex-1 basis-0 items-center gap-x-3">
          {paymentInfo?.icon}
          <span className="text-base-regular">{paymentInfo?.title}</span>
        </RadioGroup.Label>
      </RadioGroup.Option>

      {/* Hidden GiyaPay form - will auto-submit when selected */}
      <form
        ref={formRef}
        action={giyaPayUrl}
        method="post"
        style={{ display: 'none' }}
      >
        <input type="hidden" name="success_callback" value={sessionData.success_callback} />
        <input type="hidden" name="error_callback" value={sessionData.error_callback} />
        <input type="hidden" name="cancel_callback" value={sessionData.cancel_callback} />
        <input type="hidden" name="merchant_id" value={sessionData.merchant_id} />
        <input type="hidden" name="amount" value={sessionData.amount} />
        <input type="hidden" name="currency" value={sessionData.currency} />
        <input type="hidden" name="nonce" value={sessionData.nonce} />
        <input type="hidden" name="timestamp" value={sessionData.timestamp} />
        <input type="hidden" name="description" value={sessionData.description} />
        <input type="hidden" name="signature" value={sessionData.signature} />
        <input type="hidden" name="payment_method" value={getGiyaPayMethod(paymentProviderId)} />
        <input type="hidden" name="order_id" value={sessionData.order_id} />
        {sessionData.customer_email && (
          <input type="hidden" name="customer_email" value={sessionData.customer_email} />
        )}
      </form>
    </>
  );
};

export default GiyaPayContainer;



