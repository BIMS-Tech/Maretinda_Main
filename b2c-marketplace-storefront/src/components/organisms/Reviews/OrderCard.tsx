import { format } from 'date-fns';
import Image from 'next/image';

import { Button, Card, StarRating } from '@/components/atoms';
import type { Order } from '@/lib/data/reviews';

export const OrderCard = ({
	order,
	showForm,
}: {
	order: Order;
	showForm?: (review: Order) => void;
}) => {
	return (
		<Card className="flex flex-col sm:flex-row gap-6 p-3 sm:p-6 justify-between w-full shadow-[0px_4px_6px_-6px_rgba(0,_0,_0,_0.25)] border-black/15">
			<div className="flex gap-4 max-lg:items-center">
				<div>
					{order?.items?.[0]?.thumbnail ? (
						<Image
							alt="Seller photo"
							className="border border-base-primary rounded-xs w-[64px] sm:w-[86px]"
							height={86}
							src={order.items[0].thumbnail}
							width={86}
						/>
					) : (
						<Image
							alt="Seller photo"
							className="opacity-25 scale-75 w-[64px] sm:w-[86px]"
							height={86}
							src={'/images/placeholder.svg'}
							width={86}
						/>
					)}
				</div>
				<div className="flex flex-col gap-1">
					<p className="label-md text-primary !font-semibold">
						{order.seller.name}
					</p>
					<p className="label-lg text-primary !font-normal capitalize">
						{order?.items?.[0]?.subtitle}
					</p>
					<p className="label-sm text-[#999]">
						Date: {format(order.created_at, 'MMM dd, yyyy')}
					</p>
				</div>
			</div>
			<div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 w-1/2">
				{showForm ? (
					<div className="flex sm:justify-end w-full">
						<Button
							className="w-fit capitalize text-[13px] !font-medium p-2.5 px-6"
							onClick={() => showForm(order)}
						>
							Write review
						</Button>
					</div>
				) : (
					<div className="h-full -mt-2">
						<p className="text-sm text-secondary">
							{format(
								order.reviews[0].created_at,
								'MMM dd, yyyy',
							)}
						</p>
						<StarRating
							rate={order.reviews[0].rating}
							starSize={12}
						/>
						<p className="label-md mt-2">
							{order.reviews[0].customer_note}
						</p>
					</div>
				)}
			</div>
		</Card>
	);
};
