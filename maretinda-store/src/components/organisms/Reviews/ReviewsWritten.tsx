'use client';

import { isEmpty } from 'lodash';
import { usePathname } from 'next/navigation';

import { Card, NavigationItem } from '@/components/atoms';
import type { Order, Review } from '@/lib/data/reviews';

import { navigation } from './navigation';
import { OrderCard } from './OrderCard';

export const ReviewsWritten = ({
	reviews,
	orders,
}: {
	reviews: Review[];
	orders: Order[];
}) => {
	const pathname = usePathname();

	return (
		<div className="md:col-span-3 space-y-10 user-content-wrapper">
			<h1 className="text-3xl capitalize text-black font-lora !font-bold">
				Reviews
			</h1>
			<div className="flex flex-col gap-6">
				<div className="flex gap-6">
					{navigation.map((item) => (
						<NavigationItem
							className={`!p-0 !my-0 !min-w-fit ${pathname === `/ph${item.href}` ? 'underline text-black underline-offset-2' : 'text-[#A0A0A0]'}`}
							href={item.href}
							key={item.label}
						>
							{item.label}
						</NavigationItem>
					))}
				</div>
				<div className="flex flex-col gap-5">
					{isEmpty(reviews) ? (
						<Card>
							<div className="text-center py-6">
								<h3 className="heading-lg text-primary uppercase">
									No written reviews
								</h3>
								<p className="text-lg text-secondary mt-2">
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
