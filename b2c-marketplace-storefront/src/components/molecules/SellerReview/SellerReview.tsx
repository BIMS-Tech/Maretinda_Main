import { Divider } from '@medusajs/ui';
import { formatDistanceToNow } from 'date-fns';

import { Avatar, StarRating } from '@/components/atoms';
import type { SingleProductReview } from '@/types/product';

export const SellerReview = ({ review }: { review: SingleProductReview }) => {
	return (
		<div className="mb-10 border-b pb-4 flex flex-col items-start gap-6">
			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-3">
					<Avatar
						className="rounded-full h-8 w-8"
						initials="M"
						size="large"
						src={
							// item.order.seller.photo ||
							'/talkjs-placeholder.jpg'
						}
					/>
					<div className="flex flex-col gap-0.5">
						<p className="label-md text-[#181818] truncate leading-none">
							{review.customer.first_name}{' '}
							{review.customer.last_name}
						</p>
						<p className="text-sm text-[#181818] leading-none">
							{formatDistanceToNow(new Date(review.created_at), {
								addSuffix: true,
							})}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<StarRating
						rate={Number(review.rating.toFixed(1))}
						starSize={16}
					/>
					<span className="text-md text-black/60 !font-medium">
						<span className="text-black">4.5/</span>5
					</span>
				</div>
			</div>
			<div className="w-full">
				<p className="text-base">{review.customer_note}</p>
				{review.seller_note && (
					<div className="mt-4 flex gap-4 relative">
						<Divider className="h-auto" orientation="vertical" />
						<div>
							<p className="label-md text-primary">
								Reply from {review.seller?.name}{' '}
								<span className="text-secondary">
									|{' '}
									{formatDistanceToNow(
										new Date(review.updated_at),
										{
											addSuffix: true,
										},
									)}
								</span>
							</p>
							<p className="label-sm mt-2">
								{review.seller_note}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
