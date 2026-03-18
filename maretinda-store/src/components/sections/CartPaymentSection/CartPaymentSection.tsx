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

const GIYAPAY_METHOD_CONFIG: Record<string, { title: string; icon: React.ReactNode }> = {
	'MASTERCARD/VISA': {
		title: 'Visa / Mastercard',
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
		icon: (
			<div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none"/>
					<text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">G</text>
				</svg>
			</div>
		),
	},
	'QRPH': {
		title: 'QR Ph',
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
	'WECHATPAY': {
		title: 'WeChat Pay',
		icon: (
			<div className="flex items-center justify-center" style={{ width: '48px', height: '32px' }}>
				<svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect width="48" height="32" rx="4" fill="#07C160"/>
					<text x="24" y="21" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">WeChat</text>
				</svg>
			</div>
		),
	},
	'UNIONPAY': {
		title: 'UnionPay',
		icon: (
			<div className="flex items-center justify-center" style={{ width: '48px', height: '32px' }}>
				<svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect width="48" height="32" rx="4" fill="#C0153E"/>
					<text x="24" y="21" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">UnionPay</text>
				</svg>
			</div>
		),
	},
};

const DEFAULT_GIYAPAY_METHODS = ['MASTERCARD/VISA', 'GCASH', 'QRPH', 'WECHATPAY', 'UNIONPAY'];

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
	const [selectedGiyaSubMethod, setSelectedGiyaSubMethod] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('giyapay_selected_method') || '';
		}
		return '';
	});
	const [giyaPayEnabledMethods, setGiyaPayEnabledMethods] = useState<string[]>(DEFAULT_GIYAPAY_METHODS);

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

	// Fetch enabled GiyaPay methods from backend on mount
	useEffect(() => {
		// First check if an existing session already has enabled_methods
		const existingSession = cart.payment_collection?.payment_sessions?.find(
			(ps: any) => isGiyaPayFunc(ps.provider_id)
		);
		if (existingSession?.data?.enabled_methods && Array.isArray(existingSession.data.enabled_methods)) {
			setGiyaPayEnabledMethods(existingSession.data.enabled_methods);
			return;
		}
		// Otherwise fetch from the Next.js API proxy
		fetch('/api/giyapay/methods')
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data.enabledMethods) && data.enabledMethods.length > 0) {
					setGiyaPayEnabledMethods(data.enabledMethods);
				}
			})
			.catch(() => {/* keep defaults */});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const setGiyaPaySubMethod = async (method: string) => {
		setError(null);
		setSelectedGiyaSubMethod(method);
		if (typeof window !== 'undefined') {
			localStorage.setItem('giyapay_selected_method', method);
		}
		// Initiate GiyaPay session if not already active
		if (giyaPayMethod && selectedPaymentMethod !== giyaPayMethod.id) {
			setSelectedPaymentMethod(giyaPayMethod.id);
			setIsLoading(true);
			try {
				await initiatePaymentSession(cart, { provider_id: giyaPayMethod.id });
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to initiate payment session');
			} finally {
				setIsLoading(false);
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

	const giyaPayMethod = availablePaymentMethods?.find((m) => isGiyaPayFunc(m.id));
	const codMethods = availablePaymentMethods?.filter((m) => !isGiyaPayFunc(m.id) && !isStripeFunc(m.id));
	const stripeMethod = availablePaymentMethods?.find((m) => isStripeFunc(m.id));

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
						<div className="flex flex-col gap-3">
							{/* GiyaPay sub-methods as direct top-level options */}
							{giyaPayMethod && giyaPayEnabledMethods.map((method) => {
								const config = GIYAPAY_METHOD_CONFIG[method];
								if (!config) return null;
								const isSelected = isGiyaPayFunc(selectedPaymentMethod) && selectedGiyaSubMethod === method;
								return (
									<button
										key={method}
										type="button"
										onClick={() => setGiyaPaySubMethod(method)}
										className="w-full flex items-center gap-x-4 px-5 py-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
										style={{
											borderColor: isSelected ? '#3b82f6' : '#d1d5db',
											borderWidth: isSelected ? '2px' : '1px',
											backgroundColor: isSelected ? '#eff6ff' : 'white',
										}}
									>
										<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}>
											{isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
										</div>
										<div className="flex-shrink-0">{config.icon}</div>
										<span className="text-base font-semibold" style={{ color: '#111827' }}>{config.title}</span>
									</button>
								);
							})}

							{/* Stripe — own card */}
							{stripeMethod && (
								<RadioGroup onChange={(value: string) => setPaymentMethod(value)} value={selectedPaymentMethod}>
									<div className="border border-gray-300 rounded-lg overflow-hidden">
										<StripeCardContainer
											paymentInfoMap={paymentInfoMap}
											paymentProviderId={stripeMethod.id}
											selectedPaymentOptionId={selectedPaymentMethod}
											setCardBrand={setCardBrand}
											setCardComplete={setCardComplete}
											setError={setError}
										/>
									</div>
								</RadioGroup>
							)}

							{/* Cash on Delivery & other non-GiyaPay methods */}
							{codMethods && codMethods.length > 0 && (
								<RadioGroup onChange={(value: string) => setPaymentMethod(value)} value={selectedPaymentMethod}>
									<div className="flex flex-col gap-3">
										{codMethods.map((paymentMethod) => (
											<div key={paymentMethod.id} className="border border-gray-300 rounded-lg overflow-hidden">
												<PaymentContainer
													paymentInfoMap={paymentInfoMap}
													paymentProviderId={paymentMethod.id}
													selectedPaymentOptionId={selectedPaymentMethod}
												/>
											</div>
										))}
									</div>
								</RadioGroup>
							)}
						</div>
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
							(!selectedPaymentMethod && !paidByGiftcard) ||
						(isGiyaPayFunc(selectedPaymentMethod) && !selectedGiyaSubMethod)
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
								{isGiyaPayFunc(activeSession?.provider_id) ? (GIYAPAY_METHOD_CONFIG[selectedGiyaSubMethod]?.title || selectedGiyaSubMethod || 'GiyaPay') : (paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id)}
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
