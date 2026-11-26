'use client';

import { Loader } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Collapse, MorphButton } from '@/components/motion';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { setShippingMethod } from '@/lib/data/cart';
import { calculatePriceForShippingOption } from '@/lib/data/fulfillment';
import { convertToLocale } from '@/lib/helpers/money';
import { chosenMethodFor, sellerNamesById } from '@/lib/helpers/shipping-by-seller';

import { CheckoutStepHeader, Choice } from '../CheckoutStep/CheckoutStep';

// Extended cart item product type to include seller
type ExtendedStoreProduct = HttpTypes.StoreProduct & {
	seller?: {
		id: string;
		name: string;
	};
};

// Cart item type definition
type CartItem = {
	product?: ExtendedStoreProduct;
	// Include other cart item properties as needed
};

export type StoreCardShippingMethod = HttpTypes.StoreCartShippingOption & {
	seller_id?: string;
	service_zone?: {
		fulfillment_set: {
			type: string;
		};
	};
};

type ShippingProps = {
	cart: Omit<HttpTypes.StoreCart, 'items'> & {
		items?: CartItem[];
	};
	availableShippingMethods:
		| (StoreCardShippingMethod &
				{
					rules: any;
					seller_id: string;
					price_type: string;
					id: string;
				}[])
		| null;
};

const CartShippingMethodsSection: React.FC<ShippingProps> = ({
	cart,
	availableShippingMethods,
}) => {
	const [isLoadingPrices, setIsLoadingPrices] = useState(false);
	const [calculatedPricesMap, setCalculatedPricesMap] = useState<
		Record<string, number>
	>({});
	const [error, setError] = useState<string | null>(null);
	/** Picked but not yet in the cart */
	const [picking, setPicking] = useState<string | null>(null);
	const [missingModal, setMissingModal] = useState(false);
	const [missingShippingSellers, setMissingShippingSellers] = useState<
		string[]
	>([]);

	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const isOpen = searchParams.get('step') === 'delivery';

	const _shippingMethods = availableShippingMethods?.filter(
		(sm) =>
			sm.rules?.find((rule: any) => rule.attribute === 'is_return')
				?.value !== 'true',
	);

	useEffect(() => {
		const set = new Set<string>();
		cart.items?.forEach((item) => {
			if (item?.product?.seller?.id) {
				set.add(item.product.seller.id);
			}
		});

		const sellerMethods = _shippingMethods?.map(
			({ seller_id }) => seller_id,
		);

		const missingSellerIds = [...set].filter(
			(sellerId) => !sellerMethods?.includes(sellerId),
		);

		setMissingShippingSellers(Array.from(missingSellerIds));

		if (missingSellerIds.length > 0 && !cart.shipping_methods?.length) {
			setMissingModal(true);
		}
	}, [cart]);

	useEffect(() => {
		if (_shippingMethods?.length) {
			const promises = _shippingMethods
				.filter((sm) => sm.price_type === 'calculated')
				.map((sm) => calculatePriceForShippingOption(sm.id, cart.id));

			if (promises.length) {
				Promise.allSettled(promises).then((res) => {
					const pricesMap: Record<string, number> = {};
					res.filter((r) => r.status === 'fulfilled').forEach(
						(p) =>
							(pricesMap[p.value?.id || ''] = p.value?.amount!),
					);

					setCalculatedPricesMap(pricesMap);
					setIsLoadingPrices(false);
				});
			}
		}
	}, [availableShippingMethods]);

	const handleSubmit = () => {
		router.push(pathname + '?step=payment', { scroll: false });
	};

	const handleSetShippingMethod = async (id: string | null) => {
		if (!id) return;
		setIsLoadingPrices(true);
		setError(null);
		setPicking(id);

		try {
			await setShippingMethod({
				cartId: cart.id,
				shippingMethodId: id,
			});
			router.refresh();
		} catch (err: any) {
			setError(err.message || 'Failed to set shipping method');
			setPicking(null);
		} finally {
			setIsLoadingPrices(false);
		}
	};

	useEffect(() => {
		setError(null);
	}, [isOpen]);

	const bySeller = new Map<string, StoreCardShippingMethod[]>();
	for (const method of (_shippingMethods ?? []) as unknown as StoreCardShippingMethod[]) {
		const sellerId = method.seller_id as string;
		bySeller.set(sellerId, [...(bySeller.get(sellerId) ?? []), method]);
	}
	const groups = [...bySeller];

	// Label each picker and chosen method with the shop it's for
	const sellerNames = sellerNamesById(cart.items as any);
	const sellerOfOption = (optionId?: string | null) =>
		_shippingMethods?.find((o) => o.id === optionId)?.seller_id;

	const handleEdit = () => {
		router.replace(pathname + '?step=delivery');
	};

	const priceOf = (option: StoreCardShippingMethod) => {
		const amount = option.price_type === 'flat' ? option.amount : calculatedPricesMap[option.id];
		if (amount === 0) return 'Free';
		if (amount) return convertToLocale({ amount, currency_code: cart.currency_code });
		return isLoadingPrices ? <Loader /> : '-';
	};

	const missingSellers = cart.items
		?.filter((item) =>
			missingShippingSellers.includes(item.product?.seller?.id!),
		)
		.map((item) => item.product?.seller?.name);

	return (
		<div>
			<CheckoutStepHeader done={(cart.shipping_methods?.length ?? 0) > 0} n={2} onEdit={handleEdit} open={isOpen} title="Delivery" />

			<Collapse open={isOpen}>
				<div className="pt-6" data-testid="delivery-options-container">
					{!groups.length && !cart.shipping_methods?.length && (
						<div className="rounded-[18px] bg-[#F8F5FB] px-5 py-8 text-center">
							<p className="text-[14px] font-semibold text-[#404040]">
								{_shippingMethods?.length ? 'No delivery options available for your location' : 'No shipping methods available'}
							</p>
							<p className="mt-1 text-[13px] text-[#8A8493]">Please make sure your shipping address is set correctly.</p>
						</div>
					)}
					{groups.map(([sellerId, options]) => {
						const chosen = chosenMethodFor(options, cart.shipping_methods ?? [])?.shipping_option_id;
						// The one just picked shows at once, before the cart says so
						const picked = picking && options.some((o) => o.id === picking) ? picking : chosen;
						const name = sellerNames[sellerId] || 'this shop';
						return (
							<div className="mb-6" key={sellerId}>
								<h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]" id={`shipping-${sellerId}`}>
									Shipping from <span className="text-[#432C63]">{name}</span>
								</h3>
								<div aria-labelledby={`shipping-${sellerId}`} className="grid gap-2.5 sm:grid-cols-2" role="radiogroup">
									{options.map((option) => (
										<Choice
											aside={priceOf(option)}
											group={`delivery-${sellerId}`}
											icon={
												<span className={`flex h-9 w-9 items-center justify-center rounded-[12px] transition-colors duration-300 ${picked === option.id ? 'bg-[#432C63] text-white' : 'bg-white text-[#432C63]'}`}>
													<svg aria-hidden="true" fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24" width="17">
														<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" /><circle cx="5.500" cy="18.500" r="2.500" /><circle cx="18.500" cy="18.500" r="2.500" />
													</svg>
												</span>
											}
											key={option.id}
											onSelect={() => picked !== option.id && handleSetShippingMethod(option.id)}
											selected={picked === option.id}
											testId="delivery-option"
											title={option.name}
										/>
									))}
								</div>
							</div>
						);
					})}
					<ErrorMessage data-testid="delivery-option-error-message" error={error} />
					<MorphButton
						busy="Saving…"
						className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-[#FFC533] px-8 text-[14px] font-bold text-[#432C63] disabled:opacity-50 sm:w-auto"
						disabled={!cart.shipping_methods?.[0]}
						done="Saved"
						idle="Continue to payment"
						onClick={handleSubmit}
						state={isLoadingPrices ? 'busy' : 'idle'}
						type="button"
					/>
				</div>
			</Collapse>
			<Collapse open={!isOpen && (cart.shipping_methods?.length ?? 0) > 0}>
				<div className="pt-4">
					{cart && (cart.shipping_methods?.length ?? 0) > 0 && (
						<div className="space-y-2">
							{cart.shipping_methods?.map((method) => {
								const shippingCost: string =
									method.amount === 0
										? 'Free'
										: convertToLocale({
												amount: method.amount!,
												currency_code: cart?.currency_code || 'USD',
											});
								return (
									<div
										key={method.id}
										className="flex items-center justify-between gap-3 rounded-[18px] bg-[#F8F5FB] px-4 py-3"
									>
										<div className="flex items-center gap-3 min-w-0">
											<span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(67,44,99,0.08)', color: '#432C63' }}>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
											</span>
											<span className="min-w-0">
												{sellerNames[sellerOfOption(method.shipping_option_id) ?? ''] && (
													<span className="block text-[12px] truncate" style={{ color: '#6b7280' }}>
														{sellerNames[sellerOfOption(method.shipping_option_id) ?? '']}
													</span>
												)}
												<span className="block text-[14px] font-medium truncate" style={{ color: '#111827' }}>{method.name}</span>
											</span>
										</div>
										<span className="text-[14px] font-semibold flex-shrink-0" style={{ color: '#432C63' }}>{shippingCost}</span>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</Collapse>
		</div>
	);
};

export default CartShippingMethodsSection;
