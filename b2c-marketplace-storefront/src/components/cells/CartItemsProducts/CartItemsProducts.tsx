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
	products: (HttpTypes.StoreCartLineItem & { vendorName?: string })[];
	currency_code: string;
	delete_item?: boolean;
	change_quantity?: boolean;
}) => {
	return (
		<div className="w-full">
			{/* Table Header */}
			<div className="grid grid-cols-12 gap-4 pb-4 border-b mb-4 font-medium text-sm" style={{ color: '#6b7280', borderColor: '#e5e7eb' }}>
				<div className="col-span-5 text-left">Products</div>
				<div className="col-span-2 text-center">Price</div>
				<div className="col-span-2 text-center">Quantity</div>
				<div className="col-span-2 text-right">Subtotal</div>
				<div className="col-span-1"></div>
			</div>

			{/* Product Rows */}
			<div className="space-y-4">
				{products.map((product) => {
					const { options } = product.variant ?? {};
					const unitPrice = convertToLocale({
						amount: product.unit_price || 0,
						currency_code,
					});

					const subtotal = convertToLocale({
						amount: product.total,
						currency_code,
					});

					return (
						<div
							key={product.id}
							className="grid grid-cols-12 gap-4 items-center py-4 border-b last:border-0"
							style={{ borderColor: '#f3f4f6' }}
						>
							{/* Product Image and Info */}
							<div className="col-span-5 flex items-center gap-4">
								<LocalizedClientLink
									href={`/products/${product.product_handle}`}
								>
									<div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded">
										{product.thumbnail ? (
											<Image
												alt={product.title || 'Product'}
												className="rounded object-contain"
												height={80}
												src={decodeURIComponent(
													product.thumbnail,
												)}
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
										)}
									</div>
								</LocalizedClientLink>
								<div className="flex-1 min-w-0">
									<LocalizedClientLink
										href={`/products/${product.product_handle}`}
									>
										<h3 className="font-medium truncate mb-1" style={{ color: '#111827', fontWeight: 500 }}>
											{product.title || product.subtitle}
										</h3>
									</LocalizedClientLink>
									{product.vendorName && (
										<p className="text-xs" style={{ color: '#6b7280' }}>
											Vendor: {product.vendorName}
										</p>
									)}
								</div>
							</div>

							{/* Price */}
							<div className="col-span-2 text-center font-medium" style={{ color: '#111827', fontWeight: 500 }}>
								{unitPrice}
							</div>

							{/* Quantity */}
							<div className="col-span-2 flex justify-center">
								{change_quantity ? (
									<UpdateCartItemButton
										lineItemId={product.id}
										quantity={product.quantity}
									/>
								) : (
									<span className="font-medium" style={{ color: '#111827', fontWeight: 500 }}>
										{product.quantity}
									</span>
								)}
							</div>

							{/* Subtotal */}
							<div className="col-span-2 text-right font-medium" style={{ color: '#111827', fontWeight: 500 }}>
								{subtotal}
							</div>

							{/* Delete Button */}
							<div className="col-span-1 flex justify-end">
								{delete_item && (
									<DeleteCartItemButton id={product.id} />
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
