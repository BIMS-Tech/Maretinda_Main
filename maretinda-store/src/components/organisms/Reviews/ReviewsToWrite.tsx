'use client';

import type { HttpTypes } from '@medusajs/types';
import { isEmpty } from 'lodash';
import { useState } from 'react';

import { Card } from '@/components/atoms';
import { Modal, ReviewForm } from '@/components/molecules';
import { AccountHeading } from '@/components/organisms/Layout/AccountHeading';
import type { Order } from '@/lib/data/reviews';

import { OrderCard } from './OrderCard';
import { ReviewsTabs } from './ReviewsTabs';

export const ReviewsToWrite = ({ orders }: { orders: Array<Order> }) => {
	const [showForm, setShowForm] = useState<{
		order: Order;
		productId?: string;
	} | null>(null);

	const handleShowForm = (order: Order) => {
		// Get the first product from the order items
		const firstProductId = order.items?.[0]?.product_id ?? undefined;
		setShowForm({ order, productId: firstProductId });
	};

	return (
		<>
			<div className="md:col-span-3 user-content-wrapper">
				<AccountHeading aside={<ReviewsTabs />} title="Reviews" />

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-5">
						{isEmpty(orders) ? (
							<Card>
								<div className="text-center py-6">
									<h3 className="text-[17px] font-bold text-[#1B1B1B]">
										No reviews to write
									</h3>
									<p className="mt-1.5 text-[13.5px] text-[#737373]">
										Once an order arrives, you can tell others what you thought of it here.
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
