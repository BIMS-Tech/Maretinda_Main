'use client';

import type { HttpTypes } from '@medusajs/types';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import type React from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/atoms';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { placeOrder } from '@/lib/data/cart';

import { isGiyaPay, isManual, isStripe } from '../../../lib/constants';
import GiyaPayButton from './GiyaPayButton';

type PaymentButtonProps = {
	cart: HttpTypes.StoreCart;
	'data-testid': string;
};

const PaymentButton: React.FC<PaymentButtonProps> = ({
	cart,
	'data-testid': dataTestId,
}) => {
	const notReady =
		!cart ||
		!cart.shipping_address ||
		!cart.billing_address ||
		!cart.email ||
		(cart.shipping_methods?.length ?? 0) < 1;

	const paymentSession = cart.payment_collection?.payment_sessions?.[0];

	switch (true) {
		case isStripe(paymentSession?.provider_id):
			return (
				<StripePaymentButton
					cart={cart}
					data-testid={dataTestId}
					notReady={notReady}
				/>
			);
		case isGiyaPay(paymentSession?.provider_id):
			return <GiyaPayButton cart={cart} data-testid={dataTestId} />;
		case isManual(paymentSession?.provider_id):
			return (
				<ManualTestPaymentButton
					data-testid={dataTestId}
					notReady={notReady}
				/>
			);
		default:
			return (
				<Button className="w-full" disabled>
					Select a payment method
				</Button>
			);
	}
};

const StripePaymentButton = ({
	cart,
	notReady,
	'data-testid': dataTestId,
}: {
	cart: HttpTypes.StoreCart;
	notReady: boolean;
	'data-testid'?: string;
}) => {
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [disabled, setDisabled] = useState(true);

	const onPaymentCompleted = async () => {
		await placeOrder()
			.catch((err) => {
				setErrorMessage(err.message);
			})
			.finally(() => {
				setSubmitting(false);
			});
	};

	const stripe = useStripe();
	const elements = useElements();
	const card = elements?.getElement('card');

	const session = cart.payment_collection?.payment_sessions?.find(
		(s) => s.status === 'pending',
	);

	useEffect(() => {
		//@ts-expect-error
		setDisabled(!card?._complete);
	}, [card, stripe, elements, cart]);

	const handlePayment = async () => {
		setSubmitting(true);

		if (!stripe || !elements || !card || !cart) {
			setSubmitting(false);
			return;
		}

		await stripe
			.confirmCardPayment(session?.data.client_secret as string, {
				payment_method: {
					billing_details: {
						address: {
							city: cart.billing_address?.city ?? undefined,
							country:
								cart.billing_address?.country_code ?? undefined,
							line1: cart.billing_address?.address_1 ?? undefined,
							line2: cart.billing_address?.address_2 ?? undefined,
							postal_code:
								cart.billing_address?.postal_code ?? undefined,
							state: cart.billing_address?.province ?? undefined,
						},
						email: cart.email,
						name:
							cart.billing_address?.first_name +
							' ' +
							cart.billing_address?.last_name,
						phone: cart.billing_address?.phone ?? undefined,
					},
					card: card,
				},
			})
			.then(({ error, paymentIntent }) => {
				if (error) {
					const pi = error.payment_intent;

					if (
						(pi && pi.status === 'requires_capture') ||
						(pi && pi.status === 'succeeded')
					) {
						onPaymentCompleted();
					}

					setErrorMessage(error.message || null);
					return;
				}

				if (
					(paymentIntent &&
						paymentIntent.status === 'requires_capture') ||
					paymentIntent.status === 'succeeded'
				) {
					return onPaymentCompleted();
				}

				return;
			});
	};

	return (
		<>
			<Button
				className="w-full py-2.5 !text-black !font-medium rounded-sm text-md"
				disabled={disabled || notReady}
				loading={submitting}
				onClick={handlePayment}
			>
				Place order
			</Button>
			<ErrorMessage
				data-testid="stripe-payment-error-message"
				error={errorMessage}
			/>
		</>
	);
};

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const onPaymentCompleted = async () => {
		await placeOrder().catch((err) => {
			setErrorMessage(
				err.message !== 'NEXT_REDIRECT' ? err.message : null,
			);
		});
	};

	const handlePayment = () => {
		onPaymentCompleted();
	};

	return (
		<>
			<Button
				className="w-full py-2.5 !text-black !font-medium rounded-sm text-md"
				disabled={notReady}
				onClick={handlePayment}
			>
				Place order
			</Button>
			<ErrorMessage
				data-testid="manual-payment-error-message"
				error={errorMessage}
			/>
		</>
	);
};

export default PaymentButton;
