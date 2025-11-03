import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SellerReview } from '@/components/molecules/SellerReview/SellerReview';
import type { SellerProps } from '@/types/seller';

const ProductTabRating = ({ seller }: { seller: SellerProps }) => {
	if (!seller) return null;

	const { reviews = [] } = seller;

	return (
		<div className="product-details !text-base !text-black">
			<div>
				<div className="flex items-center justify-between">
					<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
						Customer Reviews ({reviews.length})
					</h3>
					{reviews.length > 0 && (
						<LocalizedClientLink
							href={`/sellers/${seller.handle}/reviews`}
						>
							<span className="text-base text-black underline">
								See all Reviews
							</span>
						</LocalizedClientLink>
					)}
				</div>
				<div className="w-full mt-10">
					{reviews.length > 0 ? (
						reviews
							?.filter((rev) => rev !== null)
							.slice(-5)
							.map((review) => (
								<SellerReview key={review.id} review={review} />
							))
					) : (
						<div className="text-center w-full my-10">
							<h2 className="uppercase text-primary heading-lg">
								no reviews
							</h2>
							<p className="mt-4 text-lg">
								Sorry, there are currently no reviews for this
								item
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProductTabRating;
