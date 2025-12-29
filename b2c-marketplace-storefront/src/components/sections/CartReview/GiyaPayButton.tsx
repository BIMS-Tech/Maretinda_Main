'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { ErrorMessage } from '@/components/molecules';
import { placeOrder } from '@/lib/data/cart';

type GiyaPayButtonProps = {
	cart: HttpTypes.StoreCart;
	'data-testid'?: string;
};

const GiyaPayButton = ({
	cart,
	'data-testid': dataTestId,
}: GiyaPayButtonProps) => {
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();

	const onPaymentCompleted = () => {
		placeOrder()
			.then(() => {
				setSubmitting(false);
			})
			.catch((err) => {
				setErrorMessage(err.message);
				setSubmitting(false);
			});
	};

	const handlePayment = async () => {
		setSubmitting(true);
		setErrorMessage(null);

		if (!cart) {
			setSubmitting(false);
			return;
		}

		try {
			// Get the GiyaPay payment session data
			const activeSession =
				cart.payment_collection?.payment_sessions?.find(
					(session: any) =>
						session.provider_id === 'giyapay' ||
						session.provider_id?.startsWith('pp_giyapay'),
				);

			if (!activeSession) {
				throw new Error('GiyaPay payment session not found');
			}

			const sessionData = activeSession.data;
			const formData = sessionData?.form_data || sessionData;

			// Get selected payment method from localStorage (set by GiyaPayGatewayDirect)
			const selectedMethod = typeof window !== 'undefined' 
				? localStorage.getItem('giyapay_selected_method') 
				: null;

			if (!selectedMethod) {
				throw new Error('Please select a payment method (VISA, GCash, InstaPay, etc.)');
			}

			// Get checkout URL from session data
			const checkoutUrl = sessionData?.checkout_url || 
				(sessionData?.sandbox_mode ? 'https://sandbox.giyapay.com/checkout' : 'https://pay.giyapay.com/checkout');

			// Create the form for GiyaPay checkout
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = checkoutUrl;

			// Add all required fields as hidden inputs
			const fields = {
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
				payment_method: selectedMethod, // Include the selected payment method
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

			// Add form to page and submit
			document.body.appendChild(form);
			form.submit();

			// Clean up
			document.body.removeChild(form);
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
				Pay with GiyaPay
			</Button>
			<ErrorMessage
				data-testid="giyapay-payment-error-message"
				error={errorMessage}
			/>
		</>
	);
};

export default GiyaPayButton;
