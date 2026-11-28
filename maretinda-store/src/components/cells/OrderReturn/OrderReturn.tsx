'use client';

import { account } from '@/lib/account-styles';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const OrderReturn = ({ order, another = false }: { order: any; another?: boolean }) => {
	return (
		<div className={`${account.panel} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
			<div>
				<h2 className={account.panelTitle}>{another ? 'Something wrong with another item?' : 'Something wrong with it?'}</h2>
				<p className={account.panelText}>
					Once you receive your order, you will have 7 days to
					return items. Find out more about{' '}
					<LocalizedClientLink className="text-[#432C63] underline underline-offset-2" href="/returns-policy">
						returns and refunds
					</LocalizedClientLink>
					.
				</p>
			</div>
			<LocalizedClientLink className={`${account.outlineButton} shrink-0`} href={`/user/orders/${order.id}/return`}>
				Ask for a return
			</LocalizedClientLink>
		</div>
	);
};
