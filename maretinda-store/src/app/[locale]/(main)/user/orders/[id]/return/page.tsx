import { OrderReturnSection } from '@/components/sections/OrderReturnSection/OrderReturnSection';
import { retrieveOrder } from '@/lib/data/orders';

export default async function ReturnOrderPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const order = (await retrieveOrder(id)) as any;

	return (
		<main className="max-w-7xl w-full mx-auto">
			<div className="container w-full">
				<OrderReturnSection order={order} />
			</div>
		</main>
	);
}
