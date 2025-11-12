'use client';

// import { useEffect, useRef, useState } from 'react';

import { Badge, Card } from '@/components/atoms';
// import { OrderProductListItem } from '@/components/cells';
// import { CollapseIcon } from '@/icons';
import { parcelStatuses, steps } from '@/lib/helpers/parcel-statuses';
// import { cn } from '@/lib/utils';

export const ParcelAccordionItems = ({
	order,
	orderDisplayId,
	totalPrice,
	index,
	currency_code,
}: {
	order: any;
	orderDisplayId: string;
	index: number;
	currency_code: string;
	totalPrice: string;
}) => {
	// const [isOpen, setIsOpen] = useState(false);
	// const [height, setHeight] = useState(0);

	// const contentRef = useRef<HTMLDivElement>(null);

	// useEffect(() => {
	// 	setTimeout(() => {
	// 		if (contentRef.current) {
	// 			setHeight(contentRef.current.scrollHeight);
	// 		}
	// 	}, 100);
	// }, []);

	// const openHandler = () => {
	// 	setIsOpen((prev) => !prev);
	// };

	const status = parcelStatuses(order.fulfillment_status);

	const allOrders = order?.items?.length;
	const getFirstOrderItem = order?.items?.[0];

	return (
		<Card className="border-0 p-0" key={order.id}>
			<button
				className="flex flex-col sm:flex-row ms:items-center w-full cursor-pointer hover:bg-component-secondary/40 p-4 px-6 gap-5 md:gap-10 transition-all duration-300"
				// onClick={openHandler}
				type="button"
			>
				<div className="flex-1 w-full flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-4 text-black text-base">
					<div className="flex justify-start lg:w-[22%]">
						<p className="label-lg !font-normal">
							{orderDisplayId}
						</p>
					</div>
					<div className="flex justify-start lg:w-[36%]">
						<p className="label-lg !font-normal text-left">
							{getFirstOrderItem.product_title}{' '}
							{allOrders > 1 && (
								<span className="text-caption text-[#999]">
									+{allOrders} more...
								</span>
							)}
						</p>
					</div>
					<div className="flex lg:justify-end lg:w-[20%]">
						<p className="label-lg !font-normal">{totalPrice}</p>
					</div>
					<div className="flex lg:justify-end lg:w-[20%]">
						<Badge status={steps[status]}>{steps[status]}</Badge>
					</div>
				</div>
				<div className="lg:w-[14%] flex lg:justify-end items-center" />
			</button>
			{/* <div
				className={cn('transition-all duration-300 overflow-hidden')}
				ref={contentRef}
				style={{
					maxHeight: isOpen ? `${height}px` : '0px',
					opacity: isOpen ? 1 : 0,
					transition:
						'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out',
				}}
			>
				<div className="p-4">
					{order.items.map((item: any, idx: number) => (
						<OrderProductListItem
							currency_code={currency_code}
							item={item}
							key={item.id + item.variant_id}
						/>
					))}
				</div>
			</div> */}
		</Card>
	);
};
