import type { HttpTypes } from '@medusajs/types';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SellerReview } from '@/components/molecules/SellerReview/SellerReview';
import type {
	AdditionalAttributeProps,
	SingleProductReview,
} from '@/types/product'; // <-- Ensure SingleProductReview is here
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
	// if (!seller) return null;

	const reviews: SingleProductReview[] = [
		{
			created_at: '2025-10-28T10:00:00.000Z',
			customer: {
				first_name: 'Alex',
				last_name: 'Smith',
			},
			customer_note:
				'Fantastic product! It arrived a day early and was exactly as pictured. I highly recommend this seller and item.',
			id: 'rev_A1B2C3D4E5',
			image: 'https://images.example.com/reviews/product-review-1.jpg',
			rating: 5.0,
			// 👇 CORRECTED SELLER OBJECT 👇
			seller: {
				created_at: '2024-01-01T00:00:00.000Z',
				description: 'Your favorite online store for fast shipping.',
				handle: 'quickship-retail',
				id: 'seller_XYZ',
				name: 'QuickShip Retail',
				photo: 'https://images.example.com/seller-photos/quickship.jpg',
				tax_id: 'TX12345',
			},
			updated_at: '2025-10-28T10:00:00.000Z',
			username: 'HappyCustomer99',
		},
		{
			created_at: '2025-10-25T15:45:00.000Z',
			customer: {
				first_name: 'Maria',
				last_name: 'Gomez',
			},
			customer_note:
				"The item is okay, but the color doesn't match the listing photo exactly. Shipping was a bit slow.",
			id: 'rev_F6G7H8I9J0',
			image: 'https://images.example.com/reviews/product-review-2.jpg',
			rating: 3.5,
			// 👇 CORRECTED SELLER OBJECT 👇
			seller: {
				created_at: '2024-01-01T00:00:00.000Z',
				description: 'Your favorite online store for fast shipping.',
				handle: 'quickship-retail',
				id: 'seller_XYZ',
				name: 'QuickShip Retail',
				photo: 'https://images.example.com/seller-photos/quickship.jpg',
				tax_id: 'TX12345',
			},
			seller_note:
				"We apologize for the color discrepancy and shipping delay. We've updated our photos and are reviewing our logistics to ensure quicker delivery in the future. Please contact us for a possible discount!",
			updated_at: '2025-10-26T11:20:00.000Z',
			username: 'ConcernedBuyer',
		},
		{
			created_at: '2025-10-20T08:12:00.000Z',
			customer: {
				first_name: 'David',
				last_name: 'Lee',
			},
			customer_note:
				'Great value for the price. It performs well, though I wish the packaging was more secure.',
			id: 'rev_K1L2M3N4O5',
			image: 'https://images.example.com/reviews/product-review-3.jpg',
			rating: 4.0,
			// 👇 CORRECTED SELLER OBJECT 👇
			seller: {
				created_at: '2024-01-01T00:00:00.000Z',
				description: 'Your favorite online store for fast shipping.',
				handle: 'quickship-retail',
				id: 'seller_XYZ',
				name: 'QuickShip Retail',
				photo: 'https://images.example.com/seller-photos/quickship.jpg',
				tax_id: 'TX12345',
			},
			updated_at: '2025-10-20T08:12:00.000Z',
			username: 'GoodValueShopper',
		},
	];

	// const { reviews } = seller;

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
				<div className="flex items-center justify-between">
					<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
						Customer Reviews ({reviews.length})
					</h3>
					<LocalizedClientLink href="#">
						<span className="text-base text-black underline">
							See all Reviews
						</span>
					</LocalizedClientLink>
				</div>
				<div className="w-full mt-10">
					{reviews
						?.filter((rev) => rev !== null)
						.slice(-3)
						.map((review) => (
							<SellerReview key={review.id} review={review} />
						))}
				</div>
			</div>

			<div className="mt-10">
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
