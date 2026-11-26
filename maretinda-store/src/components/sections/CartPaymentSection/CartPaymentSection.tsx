'use client';

import { RadioGroup } from '@headlessui/react';
import { CreditCard } from '@medusajs/icons';
import { Text } from '@medusajs/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Collapse, MorphButton } from '@/components/motion';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { initiatePaymentSession } from '@/lib/data/cart';
import { cn } from '@/lib/utils';

import {
	isGiyaPay as isGiyaPayFunc,
	isStripe as isStripeFunc,
	paymentInfoMap,
} from '../../../lib/constants';
import { GIYAPAY_METHOD_TITLES } from '../../../lib/helpers/giyapay-method';
import { StripeCardContainer } from '../../organisms/PaymentContainer/PaymentContainer';
import { CheckoutStepHeader, Choice } from '../CheckoutStep/CheckoutStep';

// Titles live in the helper so the order confirmation page shows the same names
const GIYAPAY_METHOD_CONFIG: Record<string, { title: string; icon: React.ReactNode }> = {
	'INSTAPAY': {
		title: GIYAPAY_METHOD_TITLES.INSTAPAY,
		icon: <span style={{ background: '#fff', borderRadius: 4, padding: '2px 5px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-instapay.png" alt="InstaPay" style={{ height: 16, width: 'auto', objectFit: 'contain' }} /></span>,
	},
	'MASTERCARD/VISA': {
		title: GIYAPAY_METHOD_TITLES['MASTERCARD/VISA'],
		icon: <span style={{ background: '#fff', borderRadius: 4, padding: '2px 5px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-mastercard-visa.png" alt="Visa/Mastercard" style={{ height: 16, width: 'auto', objectFit: 'contain' }} /></span>,
	},
	'GCASH': {
		title: GIYAPAY_METHOD_TITLES.GCASH,
		icon: <span style={{ background: '#fff', borderRadius: 4, padding: '2px 5px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-gcash.png" alt="GCash" style={{ height: 16, width: 'auto', objectFit: 'contain' }} /></span>,
	},
	'QRPH': {
		title: GIYAPAY_METHOD_TITLES.QRPH,
		icon: <span style={{ background: '#fff', borderRadius: 4, padding: '2px 5px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-qrph.png" alt="QR Ph" style={{ height: 16, width: 'auto', objectFit: 'contain' }} /></span>,
	},
	'WECHATPAY': {
		title: GIYAPAY_METHOD_TITLES.WECHATPAY,
		icon: <span style={{ background: '#fff', borderRadius: 4, padding: '2px 5px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-wechatpay.png" alt="WeChat Pay" style={{ height: 16, width: 'auto', objectFit: 'contain' }} /></span>,
	},
	'UNIONPAY': {
		title: GIYAPAY_METHOD_TITLES.UNIONPAY,
		icon: <span style={{ background: '#fff', borderRadius: 4, padding: '2px 5px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-unionpay.png" alt="UnionPay" style={{ height: 16, width: 'auto', objectFit: 'contain' }} /></span>,
	},
};

const DEFAULT_GIYAPAY_METHODS = ['INSTAPAY', 'MASTERCARD/VISA', 'GCASH', 'QRPH', 'WECHATPAY', 'UNIONPAY'];

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
	const [selectedGiyaSubMethod, setSelectedGiyaSubMethod] = useState<string>('');
	useEffect(() => {
		setSelectedGiyaSubMethod(localStorage.getItem('giyapay_selected_method') || '');
	}, []);
	const [giyaPayEnabledMethods, setGiyaPayEnabledMethods] = useState<string[]>(DEFAULT_GIYAPAY_METHODS);

	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const isOpen = searchParams.get('step') === 'payment';

	const isStripe = isStripeFunc(selectedPaymentMethod);

	const setPaymentMethod = async (method: string) => {
		setError(null);
		setSelectedPaymentMethod(method);
		if (isStripeFunc(method) || isGiyaPayFunc(method)) {
			try {
				await initiatePaymentSession(cart, {
					provider_id: method,
				});
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
			<CheckoutStepHeader done={!!paymentReady} n={3} onEdit={handleEdit} open={isOpen} title="Payment" />
			<div>
				{/* Folds rather than unmounts: the card fields live in here */}
				<div className={cn('grid transition-[grid-template-rows,opacity] duration-500 ease-soft', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
				<div className="min-h-0 overflow-hidden" inert={!isOpen}>
				<div className="p-[3px] pt-6">
					{!paidByGiftcard && availablePaymentMethods?.length && (
						<div aria-label="Payment method" className="flex flex-col gap-2.5" role="radiogroup">
							{/* GiyaPay sub-methods as direct top-level options */}
							{giyaPayMethod && (
								<div className="grid gap-2.5 sm:grid-cols-2">
									{giyaPayEnabledMethods.map((method) => {
										const config = GIYAPAY_METHOD_CONFIG[method];
										if (!config) return null;
										return (
											<Choice
												group="payment"
												icon={config.icon}
												key={method}
												onSelect={() => setGiyaPaySubMethod(method)}
												selected={!!isGiyaPayFunc(selectedPaymentMethod) && selectedGiyaSubMethod === method}
												title={config.title}
											/>
										);
									})}
								</div>
							)}

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
							{codMethods?.map((paymentMethod) => (
								<Choice
									group="payment"
									icon={
										<span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#432C63]">
											{paymentInfoMap[paymentMethod.id]?.icon ?? <CreditCard />}
										</span>
									}
									key={paymentMethod.id}
									onSelect={() => setPaymentMethod(paymentMethod.id)}
									selected={selectedPaymentMethod === paymentMethod.id}
									title={paymentInfoMap[paymentMethod.id]?.title || paymentMethod.id}
								/>
							))}
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

					<MorphButton
						busy="Saving…"
						className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#FFC533] px-8 text-[14px] font-bold text-[#432C63] disabled:opacity-50 sm:w-auto"
						disabled={
							(isStripe && !cardComplete) ||
							(!selectedPaymentMethod && !paidByGiftcard) ||
							(isGiyaPayFunc(selectedPaymentMethod) && !selectedGiyaSubMethod)
						}
						done="Saved"
						idle="Continue to review"
						onClick={handleSubmit}
						state={isLoading ? 'busy' : 'idle'}
						type="button"
					/>
				</div>
				</div>
				</div>

				<Collapse open={!isOpen && !!paymentReady}>
					<div className="mt-4 rounded-[18px] bg-[#F8F5FB] px-4 py-3">
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
				</Collapse>
			</div>
		</div>
	);
};

export default CartPaymentSection;
