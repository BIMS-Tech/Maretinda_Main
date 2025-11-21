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

			const paymentData = activeSession.data;

			// Create the form for GiyaPay checkout
			const form = document.createElement('form');
			form.method = 'POST';
			// Use the API URL from backend configuration, but replace /api/payment with /checkout
			const backendApiUrl =
				(typeof paymentData.api_url === 'string' ? paymentData.api_url : null) || 
				'https://pay.giyapay.com/api/payment';
			form.action = backendApiUrl.replace('/api/payment', '/checkout');

			// Add all required fields as hidden inputs
			const fields = {
				amount: (paymentData.amount as number).toString(),
				cancel_callback: paymentData.cancel_callback,
				currency: paymentData.currency,
				description: paymentData.description,
				error_callback: paymentData.error_callback,
				merchant_id: paymentData.merchant_id,
				nonce: paymentData.nonce,
				// Do not force a method; let GiyaPay's checkout handle selection
				order_id: paymentData.order_id,
				signature: paymentData.signature,
				success_callback: paymentData.success_callback,
				timestamp: (paymentData.timestamp as number).toString(),
			};

			Object.entries(fields).forEach(([name, value]) => {
				const input = document.createElement('input');
				input.type = 'hidden';
				input.name = name;
				input.value = value as string;
				form.appendChild(input);
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
