'use client';

import { RadioGroup } from '@headlessui/react';
import { CheckCircleSolid, CreditCard } from '@medusajs/icons';
import { Container, Heading, Text } from '@medusajs/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/atoms';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { initiatePaymentSession } from '@/lib/data/cart';

import {
	isGiyaPay as isGiyaPayFunc,
	isStripe as isStripeFunc,
	paymentInfoMap,
} from '../../../lib/constants';
import PaymentContainer, {
	StripeCardContainer,
} from '../../organisms/PaymentContainer/PaymentContainer';
import GiyaPayGatewayDirect from '../../organisms/PaymentContainer/GiyaPayGatewayDirect';

type StoreCardPaymentMethod = any & {
	service_zone?: {
		fulfillment_set: {
			type: string;
		};
	};
};

const CartPaymentSection = ({
	cart,
	availablePaymentMethods,
}: {
	cart: any;
	availablePaymentMethods: StoreCardPaymentMethod[] | null;
}) => {
	console.log('[Payment] Cart payment collection:', cart.payment_collection);
	console.log('[Payment] Available payment methods:', availablePaymentMethods);
	
	const activeSession = cart.payment_collection?.payment_sessions?.find(
		(paymentSession: any) => paymentSession.status === 'pending',
	);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cardBrand, setCardBrand] = useState<string | null>(null);
	const [cardComplete, setCardComplete] = useState(false);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
		activeSession?.provider_id ?? '',
	);

	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const isOpen = searchParams.get('step') === 'payment';

	const isStripe = isStripeFunc(selectedPaymentMethod);

	const setPaymentMethod = async (method: string) => {
		console.log('[Payment] Selecting payment method:', method);
		console.log('[Payment] isGiyaPay:', isGiyaPayFunc(method));
		console.log('[Payment] Cart ID:', cart.id);
		setError(null);
		setSelectedPaymentMethod(method);
		if (isStripeFunc(method) || isGiyaPayFunc(method)) {
			console.log('[Payment] Initiating payment session...');
			try {
				const result = await initiatePaymentSession(cart, {
					provider_id: method,
				});
				console.log('[Payment] Payment session initiated:', result);
			} catch (error) {
				console.error('[Payment] Failed to initiate payment session:', error);
				setError(error instanceof Error ? error.message : 'Failed to initiate payment session');
			}
		}
	};

	const paidByGiftcard =
		'gift_cards' in (cart || {}) && 
		Array.isArray((cart as any)?.gift_cards) && 
		(cart as any).gift_cards.length > 0 && 
		cart?.total === 0;

	const paymentReady =
		(activeSession && cart?.shipping_methods.length !== 0) ||
		paidByGiftcard;

	const createQueryString = useCallback(
		(name: string, value: string) => {
			const params = new URLSearchParams(searchParams);
			params.set(name, value);

			return params.toString();
		},
		[searchParams],
	);

	const handleEdit = () => {
		router.push(pathname + '?' + createQueryString('step', 'payment'), {
			scroll: false,
		});
	};

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			const shouldInputCard =
				isStripeFunc(selectedPaymentMethod) && !activeSession;

			const checkActiveSession =
				activeSession?.provider_id === selectedPaymentMethod;

			if (!checkActiveSession) {
				await initiatePaymentSession(cart, {
					provider_id: selectedPaymentMethod,
				});
			}

			if (!shouldInputCard) {
				return router.push(
					pathname + '?' + createQueryString('step', 'review'),
					{
						scroll: false,
					},
				);
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setError(null);
	}, [isOpen]);

	return (
		<div>
			{/* Header with Checkmark and Edit */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					{!isOpen && paymentReady && (
						<div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>
							<CheckCircleSolid className="text-white" width={16} height={16} />
						</div>
					)}
					<h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
						Payment
					</h2>
				</div>
				{!isOpen && paymentReady && (
					<button
						type="button"
						onClick={handleEdit}
						className="text-sm font-medium underline"
						style={{ color: '#2563eb' }}
					>
						Edit
					</button>
				)}
			</div>
			<div>
				<div className={isOpen ? 'block' : 'hidden'}>
					{!paidByGiftcard && availablePaymentMethods?.length && (
						<>
							<RadioGroup
								onChange={(value: string) =>
									setPaymentMethod(value)
								}
								value={selectedPaymentMethod}
							>
								<div className="border border-gray-300 rounded-lg overflow-hidden">
									{availablePaymentMethods.map(
										(paymentMethod, index) => (
											<div key={paymentMethod.id}>
												{isStripeFunc(paymentMethod.id) ? (
													<StripeCardContainer
														paymentInfoMap={
															paymentInfoMap
														}
														paymentProviderId={
															paymentMethod.id
														}
														selectedPaymentOptionId={
															selectedPaymentMethod
														}
														setCardBrand={setCardBrand}
														setCardComplete={
															setCardComplete
														}
														setError={setError}
													/>
												) : isGiyaPayFunc(paymentMethod.id) ? (
													<>
														{/* First, show a radio button to SELECT GiyaPay */}
														<PaymentContainer
															paymentInfoMap={
																paymentInfoMap
															}
															paymentProviderId={
																paymentMethod.id
															}
															selectedPaymentOptionId={
																selectedPaymentMethod
															}
														/>
														{/* Then, AFTER GiyaPay is selected and session is created, show payment buttons */}
														{selectedPaymentMethod === paymentMethod.id && (
															<GiyaPayGatewayDirect
																paymentSession={
																	cart.payment_collection?.payment_sessions?.find(
																		(ps: any) => ps.provider_id === paymentMethod.id
																	)
																}
																selectedPaymentOptionId={
																	selectedPaymentMethod
																}
																onSelectMethod={(method) => {
																	console.log('Selected GiyaPay method:', method);
																}}
															/>
														)}
													</>
												) : (
													<PaymentContainer
														paymentInfoMap={
															paymentInfoMap
														}
														paymentProviderId={
															paymentMethod.id
														}
														selectedPaymentOptionId={
															selectedPaymentMethod
														}
													/>
												)}
											</div>
										),
									)}
								</div>
							</RadioGroup>
						</>
					)}

					{paidByGiftcard && (
						<div className="flex flex-col w-1/3">
							<Text className="txt-medium-plus text-ui-fg-base mb-1">
								Payment method
							</Text>
							<Text
								className="txt-medium text-ui-fg-subtle"
								data-testid="payment-method-summary"
							>
								Gift card
							</Text>
						</div>
					)}

					<ErrorMessage
						data-testid="payment-method-error-message"
						error={error}
					/>

					<Button
						className="mt-6 rounded-lg !font-medium h-12 text-base"
						disabled={
							(isStripe && !cardComplete) ||
							(!selectedPaymentMethod && !paidByGiftcard)
						}
						loading={isLoading}
						onClick={handleSubmit}
						style={{ backgroundColor: '#facc15', color: '#000', fontWeight: 500 }}
						type="button"
					>
						Continue to review
					</Button>
				</div>

				<div className={isOpen ? 'hidden' : 'block'}>
					<div className="pb-2">
						{cart && paymentReady && activeSession ? (
							<p className="text-sm" style={{ color: '#6b7280' }}>
								{paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id}
							</p>
						) : paidByGiftcard ? (
							<p className="text-sm" style={{ color: '#6b7280' }}>
								Gift card
							</p>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CartPaymentSection;
