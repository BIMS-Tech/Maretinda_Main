'use client';

import { useEffect, useRef, useState } from 'react';

import { SellerReview } from '@/components/molecules';
import { REVIEW_LIMIT, REVIEW_PAGINATION_LIMIT } from '@/const';
import type { Review } from '@/lib/data/reviews';
import type { SellerProps } from '@/types/seller';

export const SellerReviewTab = ({ seller }: { seller: SellerProps }) => {
	const filteredReviews = seller.reviews?.filter(
		(r) => r !== null,
	) as Review[];

	const [limit, setLimit] = useState(REVIEW_LIMIT);
	const observerTarget = useRef(null);
	const hasMore = limit < filteredReviews.length;

	useEffect(() => {
		if (!hasMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setLimit((prevCount) => {
						const newCount = prevCount + REVIEW_PAGINATION_LIMIT;
						return Math.min(newCount, filteredReviews.length);
					});
				}
			},
			{
				root: null,
				threshold: 1.0,
			},
		);

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => {
			if (observerTarget.current) {
				observer.unobserve(observerTarget.current);
			}
		};
	}, [hasMore, filteredReviews.length]);

	const reviewCount = filteredReviews ? filteredReviews?.length : 0;

	// const rating =
	// 	filteredReviews && filteredReviews.length > 0
	// 		? filteredReviews.reduce((sum, r) => sum + r?.rating, 0) /
	// 			filteredReviews.length
	// 		: 0;

	return (
		<div className="product-details !text-base !text-black mt-12">
			<div className="flex items-center justify-between">
				<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
					Customer Reviews ({reviewCount})
				</h3>
			</div>
			<div className="w-full mt-10">
				{filteredReviews.length > 0 ? (
					<>
						{filteredReviews
							?.filter((rev) => rev !== null)
							.slice(0, limit)
							.map((review) => (
								<SellerReview key={review.id} review={review} />
							))}
						{hasMore && (
							<div
								ref={observerTarget}
								style={{
									backgroundColor: '#eee',
									padding: '20px',
									textAlign: 'center',
								}}
							>
								Loading more reviews...
							</div>
						)}
					</>
				) : (
					<div className="text-center w-full my-10">
						<h2 className="uppercase text-primary heading-lg">
							no reviews
						</h2>
						<p className="mt-4 text-lg">
							Sorry, there are currently no reviews for this item
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
