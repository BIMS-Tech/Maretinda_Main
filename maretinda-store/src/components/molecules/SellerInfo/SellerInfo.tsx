import { StarRating } from '@/components/atoms';
import { SellerAvatar } from '@/components/cells/SellerAvatar/SellerAvatar';
import { cn } from '@/lib/utils';
import type { SellerProps } from '@/types/seller';

import { SellerReview } from '../SellerReview/SellerReview';

export const SellerInfo = ({
	seller,
	header = false,
}: {
	seller: SellerProps;
	header?: boolean;
}) => {
	const { photo, name, reviews } = seller;

	const reviewCount = reviews
		? reviews?.filter((rev) => rev !== null).length
		: 0;

	const rating =
		reviews && reviews.length > 0
			? reviews
					.filter((rev) => rev !== null)
					.reduce((sum, r) => sum + r?.rating || 0, 0) / reviewCount
			: 0;

	return (
		<div className={'flex items-center gap-3 w-full'}>
			<div className="relative h-8 w-8 overflow-hidden rounded-full">
				<SellerAvatar alt={name} photo={photo} size={32} />
			</div>
			<div
				className={cn(
					'w-[90%] flex',
					header ? 'flex-col' : 'items-center justify-between',
				)}
			>
				<h3
					className={cn(
						'text-[#181818]',
						header ? 'text-2xl !font-bold' : 'text-md !font-medium',
					)}
				>
					{name}
				</h3>
				<div>
					<div className="flex items-center gap-2">
						<StarRating rate={rating || 0} starSize={20} />
						<span className="text-md text-black/60 !font-medium">
							<span className="text-black">{rating}/</span>5 (
							{reviewCount} reviews)
						</span>
					</div>
					<div className="">
						{!header &&
							reviews
								?.filter((rev) => rev !== null)
								.slice(-3)
								.map((review) => (
									<SellerReview
										key={review.id}
										review={review}
									/>
								))}
					</div>
				</div>
			</div>
		</div>
	);
};
