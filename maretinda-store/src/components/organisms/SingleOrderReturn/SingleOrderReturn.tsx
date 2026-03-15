'use client';

import { Heading } from '@medusajs/ui';
import { format } from 'date-fns';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { Avatar, Badge, Card, Divider } from '@/components/atoms';
import { StepProgressBar } from '@/components/cells/StepProgressBar/StepProgressBar';
import { CollapseIcon } from '@/icons';
import { convertToLocale } from '@/lib/helpers/money';
import { cn } from '@/lib/utils';

import { Chat } from '../Chat/Chat';

const steps = ['pending', 'processing', 'sent'];

export const SingleOrderReturn = ({
	item,
	user,
	defaultOpen,
}: {
	item: any;
	user: any;
	defaultOpen: boolean;
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [height, setHeight] = useState(0);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setTimeout(() => {
			if (contentRef.current) {
				setHeight(contentRef.current.scrollHeight);
			}
		}, 100);
	}, []);

	const filteredItems = item.order.items.filter((orderItem: any) =>
		item.line_items.some(
			(lineItem: any) => lineItem.line_item_id === orderItem.id,
		),
	);

	const currency_code = item.order.currency_code || 'usd';

	const total = filteredItems.reduce((acc: number, item: any) => {
		return acc + item.unit_price;
	}, 0);

	const currentStep = steps.indexOf(item.status);

	return (
		<>
			<Card className="bg-secondary p-4 flex justify-between mt-8">
				<Heading level="h2">Order: #{item.order.display_id}</Heading>
				<div className="flex flex-col gap-2 items-center">
					<p className="label-sm text-secondary">
						Return requested date:{' '}
						{format(item.line_items[0].created_at, 'MMM dd, yyyy')}
					</p>
				</div>
			</Card>
			<Card className="p-0">
				<div
					className="p-4 flex justify-between items-center cursor-pointer"
					onClick={() => setIsOpen(!isOpen)}
				>
					<Heading
						className="uppercase label-md !font-semibold"
						level="h3"
					>
						{item.status}
					</Heading>
					<p className="label-sm text-secondary flex gap-2">
						{item.line_items.length}{' '}
						{item.line_items.length > 1 ? 'items' : 'item'}
						<CollapseIcon
							className={cn(
								'w-5 h-5 text-secondary transition-transform duration-300',
								isOpen ? 'rotate-180' : '',
							)}
						/>
					</p>
				</div>
				<div
					className={cn(
						'transition-all duration-300 overflow-hidden',
					)}
					ref={contentRef}
					style={{
						maxHeight: isOpen ? `${height}px` : '0px',
						opacity: isOpen ? 1 : 0,
						transition:
							'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out',
					}}
				>
					<Divider />
					<div className="p-4 uppercase">
						<StepProgressBar
							currentStep={currentStep}
							steps={steps}
						/>
					</div>
					<Divider />
					<div className="p-4 flex justify-between">
						<div className="flex items-center gap-2">
							<Avatar
								src={
									item.order.seller.photo ||
									'/talkjs-placeholder.jpg'
								}
							/>
							<p className="label-lg text-primary">
								{item.order.seller.name}
							</p>
						</div>
						<Chat
							buttonClassNames="uppercase"
							order_id={item.order.id}
							seller={item.order.seller}
							user={user}
						/>
					</div>
					<Divider />
					<div className="p-4 flex justify-between w-full">
						<div className="flex flex-col gap-4 w-full">
							{filteredItems.map((item: any) => (
								<div
									className="flex items-center gap-2"
									key={item.id}
								>
									<div className="flex items-center gap-4 w-1/2">
										<div className="rounded-sm overflow-hidden border">
											{item.thumbnail ? (
												<Image
													alt={item.product_title}
													height={60}
													src={item.thumbnail}
													width={60}
												/>
											) : (
												<Image
													alt={item.product_title}
													className="scale-50 opacity-25"
													height={60}
													src="/images/placeholder.svg"
													width={60}
												/>
											)}
										</div>
										<div>
											<p className="label-md !font-semibold text-primary">
												{item.product_title}
											</p>
											<p className="label-md text-secondary">
												{item.title}
											</p>
										</div>
									</div>
									<div className="flex justify-between w-1/2">
										<p className="label-md !font-semibold text-primary">
											<Badge className="bg-primary text-primary border rounded-sm">
												{item.customer_note ||
													'No reason provided'}
											</Badge>
										</p>
										<p className="label-md !font-semibold text-primary">
											{convertToLocale({
												amount: item.unit_price,
												currency_code,
											})}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
					<Divider />
					<div className="p-4 flex justify-between">
						<p className="label-md text-secondary">Total:</p>
						<p className="label-md !font-semibold text-primary">
							{convertToLocale({
								amount: total,
								currency_code,
							})}
						</p>
					</div>
				</div>
			</Card>
		</>
	);
};
