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
import { getImageUrl } from '@/lib/helpers/get-image-url';
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
	api_product?: (HttpTypes.StoreProduct & { reviews?: any[] }) | null;
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

	// Calculate real product ratings
	const productReviews = api_product.reviews?.filter((rev: any) => rev !== null && rev.reference === 'product') || [];
	const reviewCount = productReviews.length;
	const averageRating = reviewCount > 0
		? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
		: 0;

	return (
		<div className={cn(id === 0 ? 'pt-0 pb-2' : 'py-2')}>
			<div
				className={clsx(
					'group bg-white hover:shadow-lg rounded-sm flex flex-col sm:flex-row gap-10 justify-start w-full min-h-[398px] overflow-hidden p-4 sm:p-6',
				)}
			>
				<div className="relative flex flex-col items-center justify-center gap-5 max-w-[295px] self-center sm:w-2/5 sm:max-w-[295px] bg-primary my-9">
					<div className="flex flex-row w-full justify-between items-center h-11 gap-1 z-10">
						<div className="px-1.5 py-1">
							{cheapestPrice?.calculated_price !==
								cheapestPrice?.original_price && (
								<Badge
									className="bg-brand-purple-900 text-white text-[11px] border-0"
									size="2xsmall"
								>
									{`-${40}%`}
								</Badge>
							)}
						</div>
						<div className="w-fit group-hover:block hidden">
							<WishlistButton
								className="border-0"
								productId={product.id}
								user={user}
								wishlist={wishlist}
							/>
						</div>
					</div>
					<LocalizedClientLink
						className="w-full"
						href={`/products/${product.handle}`}
					>
						<div className="overflow-hidden w-full flex flex-col justify-center align-center h-full max-h-[220px]">
							{product.images.length > 1 ? (
								<ProductImageCarousel slides={product.images} />
							) : product.thumbnail ? (
								<Image
									alt={product.title}
									className="object-cover w-full object-center h-full transition-all duration-300"
									height={220}
									priority
									src={getImageUrl(decodeURIComponent(product.thumbnail))}
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
				</div>
				<div className="flex-1 flex flex-col justify-between">
					<LocalizedClientLink
						className="flex flex-col justify-between min-h-[280px]"
						href={`/products/${product.handle}`}
					>
						<div>
							<div className="max-w-[558px]">
								<h3 className="text-3xl font-bold line-clamp-2">
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
							{reviewCount > 0 && (
								<div className="flex items-center gap-2 mt-2">
									<StarRating rate={averageRating} starSize={16} />
									<span className="text-md text-black/60 !font-medium">
										({reviewCount})
									</span>
								</div>
							)}
							</div>
							<div className="mt-4">
								<div
									className="text-base text-black"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: use to display markup content
									dangerouslySetInnerHTML={{
										__html:
											truncate(product.description, {
												length: 125,
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
