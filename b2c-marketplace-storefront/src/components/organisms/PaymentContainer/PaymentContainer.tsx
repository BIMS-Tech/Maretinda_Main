import { RadioGroup } from '@headlessui/react';
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
		<RadioGroup.Option
			className={clx(
				'flex items-center gap-x-4 cursor-pointer py-5 px-5 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors',
				{
					'bg-blue-50':
						selectedPaymentOptionId === paymentProviderId,
				},
			)}
			disabled={disabled}
			key={paymentProviderId}
			value={paymentProviderId}
		>
			{({ checked }) => (
				<>
					<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
						checked 
							? 'border-blue-600 bg-blue-600' 
							: 'border-gray-300 bg-white'
					}`}>
						{checked && (
							<div className="w-2.5 h-2.5 rounded-full bg-white"></div>
						)}
					</div>
					<div className="flex-shrink-0 flex items-center justify-center">
						{paymentInfoMap[paymentProviderId]?.icon}
					</div>
					<Text className="text-base font-semibold flex-1" style={{ color: '#111827' }}>
						{paymentInfoMap[paymentProviderId]?.title ||
							paymentProviderId}
					</Text>
					{isManual(paymentProviderId) && isDevelopment && (
						<PaymentTest className="hidden small:block" />
					)}
					{children}
				</>
			)}
		</RadioGroup.Option>
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
