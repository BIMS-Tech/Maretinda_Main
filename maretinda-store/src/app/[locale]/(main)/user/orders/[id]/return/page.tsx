import { OrderReturnSection } from '@/components/sections/OrderReturnSection/OrderReturnSection';
import { retrieveOrder } from '@/lib/data/orders';
import { listReturnCases } from '@/lib/data/returns';

export default async function ReturnOrderPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	// The order's returns so far: one still open means no new request, and items already claimed can't be again
	const [order, cases] = await Promise.all([retrieveOrder(id) as Promise<any>, listReturnCases(id)]);

	return (
		<main className="max-w-7xl w-full mx-auto">
			<div className="container w-full">
				<OrderReturnSection cases={cases} order={order} />
			</div>
		</main>
	);
}
