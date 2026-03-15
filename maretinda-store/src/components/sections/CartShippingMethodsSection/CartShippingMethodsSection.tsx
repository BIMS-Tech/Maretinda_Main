'use client';

import { Listbox, Transition } from '@headlessui/react';
import { CheckCircleSolid, ChevronUpDown, Loader } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { clx, Heading, Text } from '@medusajs/ui';
import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

import { Button } from '@/components/atoms';
import { Modal, SelectField } from '@/components/molecules';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import { setShippingMethod } from '@/lib/data/cart';
import { calculatePriceForShippingOption } from '@/lib/data/fulfillment';
import { convertToLocale } from '@/lib/helpers/money';

import { CartShippingMethodRow } from './CartShippingMethodRow';

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
		setIsLoadingPrices(true);
		setError(null);

		if (!id) {
			setIsLoadingPrices(false);
			return;
		}

		try {
			await setShippingMethod({
				cartId: cart.id,
				shippingMethodId: id,
			});
			router.refresh();
		} catch (err: any) {
			setError(err.message || 'Failed to set shipping method');
		} finally {
			setIsLoadingPrices(false);
		}
	};

	useEffect(() => {
		setError(null);
	}, [isOpen]);

	const groupedBySellerId = _shippingMethods?.reduce((acc: any, method) => {
		const sellerId = method.seller_id!;

		if (!acc[sellerId]) {
			acc[sellerId] = [];
		}

		acc[sellerId]?.push(method);
		return acc;
	}, {});

	const handleEdit = () => {
		router.replace(pathname + '?step=delivery');
	};

	const missingSellers = cart.items
		?.filter((item) =>
			missingShippingSellers.includes(item.product?.seller?.id!),
		)
		.map((item) => item.product?.seller?.name);

	return (
		<div>
			{/* Header with Checkmark and Edit */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					{!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
						<div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>
							<CheckCircleSolid className="text-white" width={16} height={16} />
						</div>
					)}
					<h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
						Delivery
					</h2>
				</div>
				{!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
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
			{isOpen ? (
				<>
					<div className="grid">
						<div data-testid="delivery-options-container">
							<div className="pb-6">
								{!_shippingMethods || _shippingMethods.length === 0 ? (
									<div className="text-center py-8">
										<p className="text-gray-500 mb-2">No shipping methods available</p>
										<p className="text-sm text-gray-400">Please make sure your shipping address is set correctly</p>
									</div>
								) : !groupedBySellerId || Object.keys(groupedBySellerId).length === 0 ? (
									<div className="text-center py-8">
										<p className="text-gray-500">No delivery options available for your location</p>
									</div>
								) : null}
								{groupedBySellerId && Object.keys(groupedBySellerId).map((key) => {
									return (
										<div className="mb-6" key={key}>
											<h3 className="text-lg font-semibold mb-4" style={{ color: '#111827' }}>
												Vendor : {groupedBySellerId[key][0].seller_name || 'Local Clothing'}
											</h3>
											<Listbox
												onChange={(value) => {
													handleSetShippingMethod(value);
												}}
												value={cart.shipping_methods?.[0]?.id || null}
											>
												<div className="relative">
													<Listbox.Button
														className={clsx(
															'relative w-full flex justify-between items-center px-4 h-14 bg-white text-left cursor-pointer focus:outline-none border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-base font-medium shadow-sm',
														)}
													>
														{({ open }) => {
															const selectedMethod = cart.shipping_methods?.[0];
															const selectedMethodName = selectedMethod ? 
																groupedBySellerId[key]?.find((m: any) => m.id === selectedMethod.id)?.name || 'Choose Delivery Option'
																: 'Choose Delivery Option';
															
															return (
																<>
																	<span className="block truncate font-normal" style={{ color: '#374151', fontSize: '15px' }}>
																		{selectedMethodName}
																	</span>
																	<ChevronUpDown
																		className={clx(
																			'transition-transform duration-200 w-5 h-5 text-gray-400',
																			{
																				'transform rotate-180':
																					open,
																			},
																		)}
																	/>
																</>
															);
														}}
													</Listbox.Button>
													<Transition
														as={Fragment}
														leave="transition ease-in duration-100"
														leaveFrom="opacity-100"
														leaveTo="opacity-0"
													>
														<Listbox.Options
															className="absolute z-20 w-full overflow-auto bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 focus:outline-none text-base mt-2"
															data-testid="shipping-address-options"
														>
															{groupedBySellerId[
																key
															].map(
																(
																	option: any,
																) => {
																	const isSelected = cart.shipping_methods?.[0]?.id === option.id;
																	return (
																		<Listbox.Option
																			className={clsx(
																				'cursor-pointer select-none relative px-4 py-4 hover:bg-gray-50 border-b last:border-b-0 first:rounded-t-lg last:rounded-b-lg',
																				isSelected && 'bg-blue-50'
																			)}
																			key={
																				option.id
																			}
																			value={
																				option.id
																			}
																		>
																			{({ selected }) => (
																				<div className="flex justify-between items-center">
																					<span className={clsx(
																						'block',
																						selected ? 'font-medium' : 'font-normal'
																					)} style={{ color: '#111827', fontSize: '15px' }}>
																						{option.name}
																					</span>
																					<span className="ml-4 font-medium" style={{ color: '#111827', fontSize: '15px' }}>
																						{option.price_type === 'flat' ? (
																							convertToLocale({
																								amount: option.amount!,
																								currency_code: cart?.currency_code,
																							})
																						) : calculatedPricesMap[option.id] ? (
																							convertToLocale({
																								amount: calculatedPricesMap[option.id],
																								currency_code: cart?.currency_code,
																							})
																						) : isLoadingPrices ? (
																							<Loader />
																						) : (
																							'-'
																						)}
																					</span>
																				</div>
																			)}
																		</Listbox.Option>
																	);
																},
															)}
														</Listbox.Options>
													</Transition>
												</div>
											</Listbox>
										</div>
									);
								})}
								{cart &&
									(cart.shipping_methods?.length ?? 0) >
										0 && (
										<div className="flex flex-col">
											{cart.shipping_methods?.map(
												(method) => (
													<CartShippingMethodRow
														currency_code={
															cart.currency_code
														}
														key={method.id}
														method={method}
													/>
												),
											)}
										</div>
									)}
							</div>
						</div>
					</div>
					<div>
						<ErrorMessage
							data-testid="delivery-option-error-message"
							error={error}
						/>
						<Button
							className="mt-6 rounded-lg !font-medium h-12 text-base"
							disabled={!cart.shipping_methods?.[0]}
							loading={isLoadingPrices}
							onClick={handleSubmit}
							style={{ backgroundColor: '#facc15', color: '#000', fontWeight: 500 }}
							type="button"
						>
							Continue to payment
						</Button>
					</div>
				</>
			) : (
				<div className="pb-2">
					{cart && (cart.shipping_methods?.length ?? 0) > 0 && (
						<div className="space-y-1">
							{cart.shipping_methods?.map((method) => {
								// Get seller name from the shipping method
								const sellerName: string = typeof method.data?.seller_name === 'string' 
									? method.data.seller_name 
									: 'Local Clothing';
								const shippingCost: string = convertToLocale({
									amount: method.amount!,
									currency_code: cart?.currency_code || 'USD',
								});
								return (
									<p key={method.id} className="text-sm" style={{ color: '#6b7280' }}>
										{method.name} - {shippingCost}
									</p>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default CartShippingMethodsSection;
