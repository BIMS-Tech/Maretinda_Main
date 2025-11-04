'use client';

import type { HttpTypes } from '@medusajs/types';
import { Badge } from '@medusajs/ui';
import clsx from 'clsx';
import type { BaseHit, Hit } from 'instantsearch.js';
import { truncate } from 'lodash';
import Image from 'next/image';

import { Avatar, Button, StarRating } from '@/components/atoms';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import { cn } from '@/lib/utils';
import type { Wishlist } from '@/types/wishlist';

import ProductImageCarousel from './ProductImageCarousel';

export const ProductBigCard = ({
	product,
	api_product,
	id,
	user,
	wishlist,
}: {
	product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>;
	api_product?: HttpTypes.StoreProduct | null;
	id: number;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	if (!api_product) {
		return null;
	}

	const { cheapestPrice } = getProductPrice({
		// biome-ignore lint/style/noNonNullAssertion: api_product will always be present
		product: api_product! as HttpTypes.StoreProduct,
	});

	return (
		<div className={cn('px-2', id === 0 ? 'pt-0 pb-2' : 'py-2')}>
			<div
				className={clsx(
					'group bg-white shadow-lg rounded-sm flex flex-row gap-2 justify-start w-full max-w-[925px] min-w-[250px] min-h-[398px] max-h-[398] overflow-hidden p-[27px]',
				)}
			>
				<div className="relative flex flex-col justify-center w-2/5 min-w-[344px] max-h-[344px] bg-primary">
					<LocalizedClientLink href={`/products/${product.handle}`}>
						<div className="relative overflow-hidden w-full flex justify-center align-center h-full max-h-[220px]">
							{product.images.length > 1 ? (
								<ProductImageCarousel slides={product.images} />
							) : product.thumbnail ? (
								<Image
									alt={product.title}
									className="object-cover w-full object-center h-full transition-all duration-300"
									height={220}
									priority
									src={decodeURIComponent(product.thumbnail)}
									width={295}
								/>
							) : (
								<Image
									alt="Product placeholder"
									height={220}
									src="/images/placeholder.svg"
									width={295}
								/>
							)}
						</div>
					</LocalizedClientLink>
					{cheapestPrice?.calculated_price !==
						cheapestPrice?.original_price && (
						<Badge
							className="absolute top-3.5 left-3.5 z-10 bg-brand-purple-900 text-white text-[11px] border-0 px-1.5 py-1"
							size="2xsmall"
						>
							{`-${40}%`}
						</Badge>
					)}
					<div className="absolute top-0 right-0 z-10 group-hover:block hidden">
						<WishlistButton
							className="border-0"
							productId={product.id}
							user={user}
							wishlist={wishlist}
						/>
					</div>
				</div>
				<div className="w-3/5 min-w-[516px] flex flex-col max-h-[344px] justify-between">
					<LocalizedClientLink
						className="flex flex-col justify-between w-full min-h-[280px]"
						href={`/products/${product.handle}`}
					>
						<div className="max-h-[224px]">
							<div className="max-h-[94px]">
								<h3 className="text-3xl font-bold truncate">
									{product.title}
								</h3>
								<div className="flex items-center gap-2 mt-2">
									<p className="font-medium text-red-500">
										{cheapestPrice?.calculated_price}
									</p>
									{cheapestPrice?.calculated_price !==
										cheapestPrice?.original_price && (
										<p className="text-md !font-medium text-gray-500 line-through">
											{cheapestPrice?.original_price}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2 mt-2">
									<StarRating rate={4} starSize={16} />
									<span className="text-md text-black/60 !font-medium">
										(88)
									</span>
								</div>
							</div>
							<div className="mt-4 max-h-[114px]">
								<div
									className="text-base text-black"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: use to display markup content
									dangerouslySetInnerHTML={{
										__html:
											truncate(product.description, {
												length: 100,
												omission: '...',
												separator: ' ',
											}) || '',
									}}
								/>
								<div className="product-details text-base">
									<ul>
										<li className="!py-0">
											{product.height || 'height'}
										</li>
										<li className="!py-0">
											{product.width || 'width'}
										</li>
										<li className="!py-0">
											{product.length || 'length'}
										</li>
									</ul>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2.5 mt-4">
							<Avatar
								className="rounded-full h-10 w-10"
								initials="M"
								size="large"
								src={'/talkjs-placeholder.jpg'}
							/>
							<p className="label-lg text-black">ZARA</p>
						</div>
					</LocalizedClientLink>
					<div className="flex flex-col w-full items-center justify-between mt-6">
						<Button className="w-full rounded-sm bg-action text-action-on-primary !font-medium h-auto lg:h-[40px]">
							Add to Cart
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
