import type { HttpTypes } from '@medusajs/types';

import { SellerReview } from '@/components/molecules/SellerReview/SellerReview';
import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';

const ProductTabRating = ({
	product,
	seller,
}: {
	seller?: SellerProps;
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
	};
}) => {
	if (!seller) return null;

	const { reviews } = seller;

	// const reviewCount = reviews
	// 	? reviews?.filter((rev) => rev !== null).length
	// 	: 0;

	// const rating =
	// 	reviews && reviews.length > 0
	// 		? reviews
	// 				.filter((rev) => rev !== null)
	// 				.reduce((sum, r) => sum + r?.rating || 0, 0) / reviewCount
	// 		: 0;

	return (
		<div className="product-details !text-base !text-black">
			<div>
				<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
					Customer Reviews (2)
				</h3>
				<div className="w-full">
					{reviews
						?.filter((rev) => rev !== null)
						.slice(-3)
						.map((review) => (
							<SellerReview key={review.id} review={review} />
						))}
				</div>
			</div>

			<div className="mt-6">
				<h3 className="text-black text-[18px] md:text-[22px]  font-semibold mb-4">
					Returns
				</h3>
				<div
					className="product-details"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: no need
					dangerouslySetInnerHTML={{
						__html: product?.description || '',
					}}
				/>
			</div>
		</div>
	);
};

export default ProductTabRating;
