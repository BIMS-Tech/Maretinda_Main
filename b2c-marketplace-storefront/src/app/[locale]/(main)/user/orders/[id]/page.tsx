import { format } from 'date-fns';
import { redirect } from 'next/navigation';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { Layout } from '@/components/organisms';
import { OrderDetailsSection } from '@/components/sections/OrderDetailsSection/OrderDetailsSection';
import { ArrowLeftIcon } from '@/icons';
import { retrieveCustomer } from '@/lib/data/customer';
import { retrieveOrderSet } from '@/lib/data/orders';

export default async function UserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const user = await retrieveCustomer();
	const orderSet = await retrieveOrderSet(id);

	if (!user) return redirect('/user');

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<LocalizedClientLink href="/user/orders">
					<Button
						className="label-md text-action-on-secondary uppercase flex items-center gap-2"
						variant="tonal"
					>
						<ArrowLeftIcon className="size-4" />
						All orders
					</Button>
				</LocalizedClientLink>
				<div className="sm:flex items-center justify-between">
					<h1 className="heading-md uppercase my-8">
						Order #{orderSet.display_id}
					</h1>
					<p className="label-md text-secondary">
						Order date:{' '}
						<span className="text-primary">
							{format(orderSet.created_at || '', 'yyyy-MM-dd')}
						</span>
					</p>
				</div>
				<OrderDetailsSection orderSet={orderSet} />
			</div>
		</Layout>
	);
}
