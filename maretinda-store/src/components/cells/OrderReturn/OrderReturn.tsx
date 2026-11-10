'use client';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const OrderReturn = ({ order }: { order: any }) => {
	return (
		<div className="md:flex justify-between items-center">
			<div className="mb-4 md:mb-0">
				<h2 className="text-primary label-lg uppercase">
					Return Order
				</h2>
				<p className="text-secondary label-md max-w-sm">
					Once you receive your order, you will have 7 days to
					return items. Find out more about{' '}
					<LocalizedClientLink className="underline" href="/help-center#returns">
						returns and refunds
					</LocalizedClientLink>
					.
				</p>
			</div>
			<LocalizedClientLink href={`/user/orders/${order.id}/return`}>
				<Button
					className="uppercase"
					onClick={() => null}
					variant="tonal"
				>
					Return
				</Button>
			</LocalizedClientLink>
		</div>
	);
};
