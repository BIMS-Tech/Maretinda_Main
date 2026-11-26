'use client';

import { isEmpty } from 'lodash';

import { Card } from '@/components/atoms';
import { AccountHeading } from '@/components/organisms/Layout/AccountHeading';
import type { Order, Review } from '@/lib/data/reviews';

import { OrderCard } from './OrderCard';
import { ReviewsTabs } from './ReviewsTabs';

export const ReviewsWritten = ({
	reviews,
	orders,
}: {
	reviews: Review[];
	orders: Order[];
}) => {
	return (
		<div className="md:col-span-3 user-content-wrapper">
			<AccountHeading aside={<ReviewsTabs />} title="Reviews" />
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-5">
					{isEmpty(reviews) ? (
						<Card>
							<div className="text-center py-6">
								<h3 className="text-[17px] font-bold text-[#1B1B1B]">
									No written reviews
								</h3>
								<p className="mt-1.5 text-[13.5px] text-[#737373]">
									You haven&apos;t written any reviews yet.
									Once you write a review, it will appear
									here.
								</p>
							</div>
						</Card>
					) : (
						<div className="space-y-2">
							{orders.map((order) => (
								<OrderCard key={order.id} order={order} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
