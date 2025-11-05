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

		await setShippingMethod({
			cartId: cart.id,
			shippingMethodId: id,
		}).catch((err) => {
			setError(err.message);
		});

		setIsLoadingPrices(false);
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
			{/* {missingModal && (
        <Modal
          heading="Missing seller shipping option"
          onClose={() => router.push(`/${pathname.split("/")[1]}/cart`)}
        >
          <div className="p-4">
            <h2 className="heading-sm">
              Some of the sellers in your cart do not have shipping options.
            </h2>

            <p className="text-md mt-3">
              Please remove the{" "}
              <span className="font-bold">
                {missingSellers?.map(
                  (seller, index) =>
                    `${seller}${
                      index === missingSellers.length - 1 ? " " : ", "
                    }`
                )}
              </span>{" "}
              items or contact{" "}
              {missingSellers && missingSellers?.length > 1 ? "them" : "him"} to
              get the shipping options.
            </p>
          </div>
        </Modal>
      )} */}
			{/* Header with Checkmark and Edit */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					{!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
						<div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>
							<CheckCircleSolid className="text-white" width={16} height={16} />
						</div>
					)}
					<h2 className="text-xl" style={{ color: '#111827', fontWeight: 700 }}>
						Delivery
					</h2>
				</div>
				{!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
					<button
						type="button"
						onClick={handleEdit}
						className="text-sm underline"
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
							<div className="pb-8 md:pt-0 pt-2">
								{Object.keys(groupedBySellerId).map((key) => {
									return (
										<div className="mb-4" key={key}>
											<Heading
												className="mb-2"
												level="h3"
											>
												{
													groupedBySellerId[key][0]
														.seller_name
												}
											</Heading>
											<Listbox
												onChange={(value) => {
													handleSetShippingMethod(
														value,
													);
												}}
												value={
													cart.shipping_methods?.[0]
														?.id
												}
											>
												<div className="relative">
													<Listbox.Button
														className={clsx(
															'relative w-full flex justify-between items-center px-4 h-12 bg-component-secondary text-left  cursor-default focus:outline-none border rounded-lg focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-gray-300 focus-visible:ring-offset-2 focus-visible:border-gray-300 text-base-regular',
														)}
													>
														{({ open }) => (
															<>
																<span className="block truncate">
																	Choose
																	delivery
																	option
																</span>
																<ChevronUpDown
																	className={clx(
																		'transition-rotate duration-200',
																		{
																			'transform rotate-180':
																				open,
																		},
																	)}
																/>
															</>
														)}
													</Listbox.Button>
													<Transition
														as={Fragment}
														leave="transition ease-in duration-100"
														leaveFrom="opacity-100"
														leaveTo="opacity-0"
													>
														<Listbox.Options
															className="absolute z-20 w-full overflow-auto text-small-regular bg-white border rounded-lg border-top-0 max-h-60 focus:outline-none sm:text-sm"
															data-testid="shipping-address-options"
														>
															{groupedBySellerId[
																key
															].map(
																(
																	option: any,
																) => {
																	return (
																		<Listbox.Option
																			className="cursor-pointer select-none relative pl-6 pr-10 hover:bg-gray-50 py-4 border-b"
																			key={
																				option.id
																			}
																			value={
																				option.id
																			}
																		>
																			{
																				option.name
																			}
																			{
																				' - '
																			}
																			{option.price_type ===
																			'flat' ? (
																				convertToLocale(
																					{
																						amount: option.amount!,
																						currency_code:
																							cart?.currency_code,
																					},
																				)
																			) : calculatedPricesMap[
																					option
																						.id
																				] ? (
																				convertToLocale(
																					{
																						amount: calculatedPricesMap[
																							option
																								.id
																						],
																						currency_code:
																							cart?.currency_code,
																					},
																				)
																			) : isLoadingPrices ? (
																				<Loader />
																			) : (
																				'-'
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
							className="mt-4 rounded-md"
							disabled={!cart.shipping_methods?.[0]}
							loading={isLoadingPrices}
							onClick={handleSubmit}
							style={{ backgroundColor: '#facc15', color: '#000' }}
						>
							Continue to payment
						</Button>
					</div>
				</>
			) : (
				<div className="pb-4">
					{cart && (cart.shipping_methods?.length ?? 0) > 0 && (
						<div className="space-y-1">
							<p className="text-sm font-medium mb-1" style={{ color: '#111827', fontWeight: 500 }}>
								Method
							</p>
							{cart.shipping_methods?.map((method) => {
								// Get seller name from the shipping method
								const sellerName = method.data?.seller_name || 'Local Clothing';
								return (
									<p key={method.id} className="text-sm" style={{ color: '#6b7280' }}>
										Vendor {sellerName} Shipping {convertToLocale({
											amount: method.amount!,
											currency_code: cart?.currency_code || 'USD',
										})}
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
