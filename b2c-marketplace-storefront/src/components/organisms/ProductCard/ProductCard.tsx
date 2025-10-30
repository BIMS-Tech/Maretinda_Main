'use client';

import type { HttpTypes } from '@medusajs/types';
import { Badge } from '@medusajs/ui';
import clsx from 'clsx';
import type { BaseHit, Hit } from 'instantsearch.js';
import Image from 'next/image';

import { Avatar, Button, StarRating } from '@/components/atoms';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { Wishlist } from '@/types/wishlist';

import ProductImageCarousel from './ProductImageCarousel';

export const ProductCard = ({
	product,
	api_product,
	locale,
	user,
	wishlist,
}: {
	product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>;
	api_product?: HttpTypes.StoreProduct | null;
	locale: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	if (!api_product) {
		return null;
	}

	const { cheapestPrice } = getProductPrice({
		product: api_product! as HttpTypes.StoreProduct,
	});

	const productImages = [
		{
			id: 1,
			imageUrl: '/images/categories/sneakers.png',
			name: 'Minimalist Smartwatch',
		},
		{
			id: 2,
			imageUrl: '/images/categories/accessories.png',
			name: 'Acoustic Noise-Cancelling Headphones',
		},
		{
			id: 3,
			imageUrl: '/images/categories/boots.png',
			name: 'Vintage Leather Camera Bag',
		},
		{
			id: 4,
			imageUrl: '/images/categories/sandals.png',
			name: 'Ergonomic Mechanical Keyboard',
		},
		{
			id: 5,
			imageUrl: '/images/categories/sport.png',
			name: 'Hand-Poured Scented Candle',
		},
	];

	return (
		<div className="py-5 px-2">
			<div
				className={clsx(
					' group bg-white shadow-lg rounded-sm flex flex-col justify-start w-full sm:max-w-[315px] lg:max-w-[295px] min-w-[250px] min-h-[400px] overflow-hidden',
				)}
			>
				<div className="relative w-full bg-primary">
					<LocalizedClientLink href={`/products/${product.handle}`}>
						<div className="relative overflow-hidden w-full h-full flex justify-center align-center max-h-[220px]">
							{productImages.length > 1 ? (
								<ProductImageCarousel slides={productImages} />
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
						{/* Add to Wishlist */}
						<WishlistButton
							className="border-0"
							productId={product.id}
							user={user}
							wishlist={wishlist}
						/>
					</div>
				</div>
				<div className="relative flex flex-1">
					<LocalizedClientLink
						className="flex flex-col justify-between p-3.5 w-full"
						href={`/products/${product.handle}`}
					>
						<div>
							<h3 className="heading-sm truncate">
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

						<div className="flex items-center gap-2.5 mt-6">
							<Avatar
								className="rounded-full h-10 w-10"
								initials="M"
								size="large"
								src={
									// item.order.seller.photo ||
									'/talkjs-placeholder.jpg'
								}
							/>
							<p className="label-lg text-black">ZARA</p>
						</div>
					</LocalizedClientLink>
					<Button className="absolute rounded-sm bg-action text-action-on-primary !font-medium group-hover:block hidden h-auto lg:h-[40px] w-[calc(100%-32px)] -mx-[calc(50%-16px)] left-1/2 bottom-3.5 z-10">
						Add to Cart
					</Button>
				</div>
			</div>
		</div>
	);
};
