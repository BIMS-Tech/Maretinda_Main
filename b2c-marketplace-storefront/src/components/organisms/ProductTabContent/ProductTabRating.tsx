import type { HttpTypes } from '@medusajs/types';

import { SellerReview } from '@/components/molecules/SellerReview/SellerReview';

const ProductTabRating = ({ product }: { product: HttpTypes.StoreProduct & { reviews?: any[] } }) => {
	if (!product) return null;

	const reviews = product.reviews?.filter((rev: any) => rev !== null && rev.reference === 'product') || [];

	return (
		<div className="w-full">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl md:text-3xl font-bold text-black">
					Customer Reviews ({reviews.length})
				</h2>
			</div>
			
			<div className="w-full">
				{reviews.length > 0 ? (
					<div className="space-y-0">
						{reviews
							.slice(0, 5)
							.map((review: any) => (
								<SellerReview key={review.id} review={review} />
							))}
					</div>
				) : (
					<div className="text-center w-full py-16 bg-gray-50 rounded-lg">
						<h2 className="text-xl font-semibold text-gray-600 uppercase">
							No Reviews Yet
						</h2>
						<p className="mt-2 text-base text-gray-500">
							Be the first to review this product
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProductTabRating;
