import { format } from 'date-fns';
import { redirect } from 'next/navigation';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MaskedText } from '@/components/motion';
import { Layout } from '@/components/organisms';
import { OrderDetailsSection } from '@/components/sections/OrderDetailsSection/OrderDetailsSection';
import { ArrowLeftIcon } from '@/icons';
import { retrieveCustomer } from '@/lib/data/customer';
import { account } from '@/lib/account-styles';
import { retrieveOrderSet } from '@/lib/data/orders';

export default async function UserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	const orderSet = await retrieveOrderSet(id);


	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<LocalizedClientLink className={account.outlineButton} href="/user/orders">
					<ArrowLeftIcon className="size-4" />
					All orders
				</LocalizedClientLink>
				<div className="my-7 flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-end">
					<h2 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-[#432C63] lg:text-[34px]">
						<MaskedText play text={`Order #${orderSet.display_id}`} />
					</h2>
					<p className="text-[14px] text-black/60">
						Placed{' '}
						<span className="font-semibold text-[#1B1B1B]">
							{format(new Date(orderSet.created_at || Date.now()), 'd MMM yyyy')}
						</span>
					</p>
				</div>
				<OrderDetailsSection orderSet={orderSet} />
			</div>
		</Layout>
	);
}
