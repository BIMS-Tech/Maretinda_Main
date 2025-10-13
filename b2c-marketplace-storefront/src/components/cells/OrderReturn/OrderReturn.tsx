'use client';

import Link from 'next/link';

import { Button } from '@/components/atoms';

export const OrderReturn = ({ order }: { order: any }) => {
	return (
		<div className="md:flex justify-between items-center">
			<div className="mb-4 md:mb-0">
				<h2 className="text-primary label-lg uppercase">
					Return Order
				</h2>
				<p className="text-secondary label-md max-w-sm">
					Once you receive your order, you will have [14] days to
					return items. Find out more about{' '}
					<Link className="underline" href="/returns">
						returns and refunds
					</Link>
					.
				</p>
			</div>
			<Link href={`/user/orders/${order.id}/return`}>
				<Button
					className="uppercase"
					onClick={() => null}
					variant="tonal"
				>
					Return
				</Button>
			</Link>
		</div>
	);
};
