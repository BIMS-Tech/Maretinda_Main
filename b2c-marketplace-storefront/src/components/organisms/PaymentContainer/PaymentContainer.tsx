import { Radio, Radio as RadioGroupOption } from '@headlessui/react';
import { clx, Text } from '@medusajs/ui';
import { CardElement } from '@stripe/react-stripe-js';
import type { StripeCardElementOptions } from '@stripe/stripe-js';
import React, { type JSX, useContext, useMemo } from 'react';

import { isManual } from '../../../lib/constants';
import PaymentTest from './PaymentTest';
import SkeletonCardDetails from './SkeletonCardDetails';
import { StripeContext } from './StripeWrapper';

type PaymentContainerProps = {
	paymentProviderId: string;
	selectedPaymentOptionId: string | null;
	disabled?: boolean;
	paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>;
	children?: React.ReactNode;
};

const PaymentContainer: React.FC<PaymentContainerProps> = ({
	paymentProviderId,
	selectedPaymentOptionId,
	paymentInfoMap,
	disabled = false,
	children,
}) => {
	const isDevelopment = process.env.NODE_ENV === 'development';

	return (
		<RadioGroupOption
			className={clx(
				'rounded-sm flex flex-col gap-y-2 text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active',
				{
					'border-primary/20':
						selectedPaymentOptionId === paymentProviderId,
				},
			)}
			disabled={disabled}
			key={paymentProviderId}
			value={paymentProviderId}
		>
			<div className="flex items-center justify-between ">
				<div className="flex items-center gap-x-4">
					<Radio
						value={selectedPaymentOptionId === paymentProviderId}
					/>
					<Text className="payment-method-title">
						{paymentInfoMap[paymentProviderId]?.title ||
							paymentProviderId}
					</Text>
					{isManual(paymentProviderId) && isDevelopment && (
						<PaymentTest className="hidden small:block" />
					)}
				</div>
				<span className="justify-self-end text-ui-fg-base">
					{paymentInfoMap[paymentProviderId]?.icon}
				</span>
			</div>
			{isManual(paymentProviderId) && isDevelopment && (
				<PaymentTest className="small:hidden text-[10px]" />
			)}
			{children}
		</RadioGroupOption>
	);
};

export default PaymentContainer;

export const StripeCardContainer = ({
	paymentProviderId,
	selectedPaymentOptionId,
	paymentInfoMap,
	disabled = false,
	setCardBrand,
	setError,
	setCardComplete,
}: Omit<PaymentContainerProps, 'children'> & {
	setCardBrand: (brand: string) => void;
	setError: (error: string | null) => void;
	setCardComplete: (complete: boolean) => void;
}) => {
	const stripeReady = useContext(StripeContext);

	const useOptions: StripeCardElementOptions = useMemo(() => {
		return {
			classes: {
				base: 'pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out',
			},
			style: {
				base: {
					'::placeholder': {
						color: 'rgb(107 114 128)',
					},
					color: '#424270',
					fontFamily: 'Inter, sans-serif',
				},
			},
		};
	}, []);

	return (
		<PaymentContainer
			disabled={disabled}
			paymentInfoMap={paymentInfoMap}
			paymentProviderId={paymentProviderId}
			selectedPaymentOptionId={selectedPaymentOptionId}
		>
			{selectedPaymentOptionId === paymentProviderId &&
				(stripeReady ? (
					<div className="my-4 transition-all duration-150 ease-in-out">
						<Text className="checkout-label">
							Enter your card details:
						</Text>
						<CardElement
							onChange={(e) => {
								setCardBrand(
									e.brand &&
										e.brand.charAt(0).toUpperCase() +
											e.brand.slice(1),
								);
								setError(e.error?.message || null);
								setCardComplete(e.complete);
							}}
							options={useOptions as StripeCardElementOptions}
						/>
					</div>
				) : (
					<SkeletonCardDetails />
				))}
		</PaymentContainer>
	);
};
