'use client';

import { Divider } from '@medusajs/ui';
import { format } from 'date-fns';
import { useMemo } from 'react';

import { Avatar, StarRating } from '@/components/atoms';
import type { Review } from '@/lib/data/reviews';

export const SellerReview = ({ review }: { review: Review }) => {
	// Get customer initials
	const getInitials = () => {
		const firstName = review.customer?.first_name || '';
		const lastName = review.customer?.last_name || '';
		if (firstName && lastName) {
			return `${firstName[0]}${lastName[0]}`.toUpperCase();
		}
		return firstName ? firstName[0].toUpperCase() : 'U';
	};

	// Format date on client side only to avoid hydration mismatch
	const formattedDate = useMemo(() => {
		if (typeof window === 'undefined') return '';
		return format(new Date(review.created_at), 'MMMM d, yyyy');
	}, [review.created_at]);

	return (
		<div className="mb-8 pb-6 border-b border-gray-200 last:border-0">
			<div className="flex items-start justify-between w-full mb-4">
				<div className="flex items-center gap-3">
					<Avatar
						className="rounded-full h-12 w-12 bg-[#F5E6D3] text-gray-700"
						initials={getInitials()}
						size="large"
					/>
					<div className="flex flex-col gap-1">
						<p className="font-semibold text-base text-black">
							{review.customer?.first_name?.toUpperCase() || 'Anonymous'}{' '}
							{review.customer?.last_name?.toUpperCase() || ''}
						</p>
						<p className="text-sm text-gray-600 min-h-[20px]">
							{formattedDate}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<StarRating
						rate={Number(review.rating.toFixed(1))}
						starSize={20}
					/>
					<span className="text-base font-medium">
						<span className="text-black">{review.rating}</span>
						<span className="text-gray-500">/5</span>
					</span>
				</div>
			</div>
			
			<div className="w-full">
				<p className="text-base text-gray-800 leading-relaxed">
					{review.customer_note}
				</p>
				{review.seller_note && (
					<div className="mt-4 pl-4 border-l-2 border-gray-200">
						<div>
							<p className="text-sm font-medium text-primary">
								Reply from {review.seller?.name}
							</p>
							<p className="text-sm text-gray-700 mt-2">
								{review.seller_note}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
