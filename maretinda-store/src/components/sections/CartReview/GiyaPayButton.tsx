'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { ErrorMessage } from '@/components/molecules';

type GiyaPayButtonProps = {
	cart: HttpTypes.StoreCart;
	'data-testid'?: string;
};

const METHOD_LABELS: Record<string, string> = {
	GCASH: 'GCash',
	'MASTERCARD/VISA': 'Visa / Mastercard',
	INSTAPAY: 'InstaPay',
	PAYMAYA: 'PayMaya',
	QRPH: 'QR Ph',
	WECHATPAY: 'WeChat Pay',
	UNIONPAY: 'UnionPay',
};

const GiyaPayButton = ({
	cart,
	'data-testid': dataTestId,
}: GiyaPayButtonProps) => {
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const selectedMethod =
		typeof window !== 'undefined'
			? localStorage.getItem('giyapay_selected_method')
			: null;
	const buttonLabel = selectedMethod
		? `Pay with ${METHOD_LABELS[selectedMethod] || selectedMethod}`
		: 'Pay with GiyaPay';

	const handlePayment = async () => {
		setSubmitting(true);
		setErrorMessage(null);

		if (!cart) {
			setSubmitting(false);
			return;
		}

		try {
			const activeSession =
				cart.payment_collection?.payment_sessions?.find(
					(session: any) =>
						session.provider_id === 'giyapay' ||
						session.provider_id?.startsWith('pp_giyapay'),
				);

			if (!activeSession) {
				throw new Error('GiyaPay payment session not found');
			}

			const sessionData = activeSession.data as any;
			const formData = sessionData?.form_data || sessionData;

			const selectedMethod =
				typeof window !== 'undefined'
					? localStorage.getItem('giyapay_selected_method')
					: null;

			if (!selectedMethod) {
				throw new Error('Please select a payment method (VISA, GCash, etc.)');
			}

			const checkoutUrl =
				sessionData?.checkout_url ||
				(sessionData?.sandbox_mode
					? 'https://sandbox.giyapay.com/checkout'
					: 'https://pay.giyapay.com/checkout');

			// Build a hidden form and submit it directly in this window.
			// GiyaPay docs: "Request should be done on html form element. Do not use Ajax."
			// GiyaPay will redirect back to success_callback / error_callback / cancel_callback.
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = checkoutUrl;
			// No target — submits in the current tab so GiyaPay's redirect lands here.

			const fields: Record<string, any> = {
				success_callback: formData.success_callback,
				error_callback: formData.error_callback,
				cancel_callback: formData.cancel_callback,
				merchant_id: formData.merchant_id,
				amount: formData.amount,
				currency: formData.currency,
				nonce: formData.nonce,
				timestamp: formData.timestamp,
				description: formData.description,
				signature: formData.signature,
				payment_method: selectedMethod,
				order_id: formData.order_id,
				...(formData.customer_email && { customer_email: formData.customer_email }),
			};

			Object.entries(fields).forEach(([name, value]) => {
				if (value !== undefined && value !== null) {
					const input = document.createElement('input');
					input.type = 'hidden';
					input.name = name;
					input.value = String(value);
					form.appendChild(input);
				}
			});

			document.body.appendChild(form);
			form.submit();
			// Page navigates away — no cleanup needed.
		} catch (error) {
			setErrorMessage((error as Error).message);
			setSubmitting(false);
		}
	};

	return (
		<>
			<Button
				className="w-full"
				data-testid={dataTestId}
				disabled={submitting}
				loading={submitting}
				onClick={handlePayment}
			>
				{buttonLabel}
			</Button>

			<ErrorMessage
				data-testid="giyapay-payment-error-message"
				error={errorMessage}
			/>
		</>
	);
};

export default GiyaPayButton;
