'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/atoms';
import { ErrorMessage } from '@/components/molecules';

type GiyaPayButtonProps = {
	cart: HttpTypes.StoreCart;
	'data-testid'?: string;
};

const GiyaPayButton = ({
	cart,
	'data-testid': dataTestId,
}: GiyaPayButtonProps) => {
	const [submitting, setSubmitting] = useState(false);
	const [waitingForPayment, setWaitingForPayment] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const popupRef = useRef<Window | null>(null);
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Listen for postMessage from giyapay success/cancel pages in the popup
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data?.type === 'giyapay_success' && event.data?.orderId) {
				cleanup();
				router.push(`/order/${event.data.orderId}/confirmed`);
			} else if (event.data?.type === 'giyapay_cancel') {
				cleanup();
				setSubmitting(false);
				setWaitingForPayment(false);
			} else if (event.data?.type === 'giyapay_error') {
				cleanup();
				setSubmitting(false);
				setWaitingForPayment(false);
				setErrorMessage(event.data?.message || 'Payment failed. Please try again.');
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [router]);

	const cleanup = () => {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
		if (popupRef.current && !popupRef.current.closed) {
			popupRef.current.close();
		}
		popupRef.current = null;
	};

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

			// Calculate centered popup position
			const width = 520;
			const height = 700;
			const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
			const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

			// Open blank popup first (must be synchronous to avoid popup blocker)
			const popup = window.open(
				'about:blank',
				'giyapay-checkout',
				`width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
			);

			if (!popup) {
				throw new Error('Popup was blocked. Please allow popups for this site and try again.');
			}

			popupRef.current = popup;
			setWaitingForPayment(true);

			// Build and submit the form targeting the popup
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = checkoutUrl;
			form.target = 'giyapay-checkout';

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
			document.body.removeChild(form);

			// Poll to detect if user manually closed the popup
			pollRef.current = setInterval(() => {
				if (popup.closed) {
					cleanup();
					setSubmitting(false);
					setWaitingForPayment(false);
				}
			}, 800);
		} catch (error) {
			setErrorMessage((error as Error).message);
			setSubmitting(false);
			setWaitingForPayment(false);
		}
	};

	return (
		<>
			<Button
				className="w-full"
				data-testid={dataTestId}
				disabled={submitting}
				loading={submitting && !waitingForPayment}
				onClick={handlePayment}
			>
				{waitingForPayment ? 'Waiting for payment...' : 'Pay with GiyaPay'}
			</Button>

			{waitingForPayment && (
				<p className="text-sm text-gray-500 mt-2 text-center">
					Complete your payment in the GiyaPay window. This page will update automatically.
				</p>
			)}

			<ErrorMessage
				data-testid="giyapay-payment-error-message"
				error={errorMessage}
			/>
		</>
	);
};

export default GiyaPayButton;
