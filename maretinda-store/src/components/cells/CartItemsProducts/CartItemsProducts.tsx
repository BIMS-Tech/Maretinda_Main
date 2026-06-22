import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';

import { DeleteCartItemButton } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { UpdateCartItemButton } from '@/components/molecules/UpdateCartItemButton/UpdateCartItemButton';
import { convertToLocale } from '@/lib/helpers/money';

export const CartItemsProducts = ({
	products,
	currency_code,
	delete_item = true,
	change_quantity = true,
}: {
	products: (HttpTypes.StoreCartLineItem & { sellerName?: string })[];
	currency_code: string;
	delete_item?: boolean;
	change_quantity?: boolean;
}) => {
	return (
		<div className="w-full">
			{/* Table Header — desktop only */}
			<div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b mb-4 !font-semibold text-lg text-black border-black/10">
				<div className="col-span-5 text-left">Products</div>
				<div className="col-span-2 text-center">Price</div>
				<div className="col-span-2 text-center">Quantity</div>
				<div className="col-span-2 text-right">Subtotal</div>
				<div className="col-span-1"></div>
			</div>

			{/* Product Rows */}
			<div className="space-y-4">
				{products.map((product) => {
					const unitPrice = convertToLocale({
						amount: product.unit_price || 0,
						currency_code,
					});

					const subtotal = convertToLocale({
						amount: product.total || 0,
						currency_code,
					});

					const productImage = product.thumbnail ? (
						<Image
							alt={product.title || 'Product'}
							className="rounded object-contain"
							height={80}
							src={decodeURIComponent(product.thumbnail)}
							width={80}
						/>
					) : (
						<Image
							alt="Product placeholder"
							className="rounded opacity-30"
							height={40}
							src={'/images/placeholder.svg'}
							width={40}
						/>
					);

					const quantityControl = change_quantity ? (
						<UpdateCartItemButton
							lineItemId={product.id}
							quantity={product.quantity}
						/>
					) : (
						<span className="font-medium text-gray-900">
							{product.quantity}
						</span>
					);

					return (
						<div
							className="py-4 border-b last:border-0 border-black/10"
							key={product.id}
						>
							{/* ── Mobile layout ── */}
							<div className="flex gap-3 md:hidden">
								<LocalizedClientLink
									href={`/products/${product.product_handle}`}
									className="shrink-0"
								>
									<div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded">
										{productImage}
									</div>
								</LocalizedClientLink>
								<div className="flex-1 min-w-0">
									<LocalizedClientLink
										href={`/products/${product.product_handle}`}
									>
										<h3 className="!font-medium line-clamp-2 text-black text-[15px] leading-snug">
											{product.title || product.subtitle}
										</h3>
									</LocalizedClientLink>
									{product.sellerName && (
										<p className="text-xs text-[#999] mt-0.5">
											seller:{' '}
											<span className="font-semibold text-black">
												{product.sellerName}
											</span>
										</p>
									)}
									<div className="flex items-center justify-between gap-2 mt-3">
										<span className="font-medium text-black">{unitPrice}</span>
										{quantityControl}
									</div>
									<div className="flex items-center justify-between gap-2 mt-3">
										<span className="text-sm text-[#999]">
											Subtotal:{' '}
											<span className="font-semibold text-black">{subtotal}</span>
										</span>
										{delete_item && (
											<DeleteCartItemButton id={product.id} />
										)}
									</div>
								</div>
							</div>

							{/* ── Desktop layout ── */}
							<div className="hidden md:grid grid-cols-12 gap-4 items-center">
								<div className="col-span-5 flex items-center gap-4">
									<LocalizedClientLink
										href={`/products/${product.product_handle}`}
									>
										<div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded">
											{productImage}
										</div>
									</LocalizedClientLink>
									<div className="flex-1 min-w-0">
										<LocalizedClientLink
											href={`/products/${product.product_handle}`}
										>
											<h3 className="!font-medium truncate mb-1 text-black text-lg">
												{product.title || product.subtitle}
											</h3>
										</LocalizedClientLink>
										{product.sellerName && (
											<p className="text-xs text-[#999]">
												seller:{' '}
												<span className="font-semibold text-black">
													{product.sellerName}
												</span>
											</p>
										)}
									</div>
								</div>

								<div className="col-span-2 text-center font-medium text-black">
									{unitPrice}
								</div>

								<div className="col-span-2 flex justify-center">
									{quantityControl}
								</div>

								<div className="col-span-2 text-right font-medium text-black">
									{subtotal}
								</div>

								<div className="col-span-1 flex justify-end">
									{delete_item && (
										<DeleteCartItemButton id={product.id} />
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
