import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { OrderConfirmedSection } from '@/components/sections/OrderConfirmedSection/OrderConfirmedSection';
import { retrieveOrder } from '@/lib/data/orders';

type Props = {
	params: Promise<{ id: string }>;
};
export const metadata: Metadata = {
	description: 'You purchase was successful',
	title: 'Order Confirmed',
};

export default async function OrderConfirmedPage(props: Props) {
	const params = await props.params;
	const order = await retrieveOrder(params.id).catch(() => null);

	if (!order) {
		return notFound();
	}

	return (
		<main className="container !max-w-7xl mx-auto">
			<OrderConfirmedSection order={order} />
		</main>
	);
}
