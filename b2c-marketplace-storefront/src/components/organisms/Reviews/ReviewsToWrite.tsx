'use client';

import type { HttpTypes } from '@medusajs/types';
import { isEmpty } from 'lodash';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Card, NavigationItem } from '@/components/atoms';
import { Modal, ReviewForm } from '@/components/molecules';
import type { Order } from '@/lib/data/reviews';

import { navigation } from './navigation';
import { OrderCard } from './OrderCard';

export const ReviewsToWrite = ({ orders }: { orders: Array<Order> }) => {
	const [showForm, setShowForm] = useState<{
		order: Order;
		productId?: string;
	} | null>(null);
	const pathname = usePathname();

	console.log(pathname);

	const handleShowForm = (order: Order) => {
		// Get the first product from the order items
		const firstProductId = order.items?.[0]?.product_id;
		setShowForm({ order, productId: firstProductId });
	};

	return (
		<>
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
						{isEmpty(orders) ? (
							<Card>
								<div className="text-center py-6">
									<h3 className="heading-lg text-primary uppercase">
										No reviews to write
									</h3>
									<p className="text-lg text-secondary mt-2">
										You currently have no one to review.
									</p>
								</div>
							</Card>
						) : (
							orders.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									showForm={handleShowForm}
								/>
							))
						)}
					</div>
				</div>
			</div>
			{showForm && (
				<Modal
					childrenClass="p-6"
					heading="Write a product review"
					headingClass="!font-semibold max-h-[60px] pb-4 px-6 flex-row text-black"
					onClose={() => setShowForm(null)}
				>
				<ReviewForm
					handleClose={() => setShowForm(null)}
					order={showForm.order}
					productId={showForm.productId}
				/>
				</Modal>
			)}
		</>
	);
};
