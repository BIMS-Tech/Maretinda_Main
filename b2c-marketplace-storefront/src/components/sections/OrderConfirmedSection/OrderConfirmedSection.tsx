'use client';

import type { HttpTypes } from '@medusajs/types';
import { Heading, Text } from '@medusajs/ui';
import { useEffect, useState } from 'react';

import OrderDetails from '@/components/organisms/OrderDefails/OrderDetails';
import OrderShipping from '@/components/organisms/OrderDefails/OrderShipping';
import OrderTotals from '@/components/organisms/OrderDefails/OrderTotals';
import OrderItems from '@/components/organisms/OrderItems/OrderItems';

export const OrderConfirmedSection = ({
	order,
}: {
	order: HttpTypes.StoreOrder;
}) => {
	const [txn, setTxn] = useState<null | {
		referenceNumber: string;
		amount: number;
		currency: string;
		gateway: string;
		vendorName?: string;
		description?: string;
	}>(null);
	const [isCod, setIsCod] = useState(false);

	useEffect(() => {
		const run = async () => {
			try {
				const backendUrl =
					process.env.NEXT_PUBLIC_BACKEND_URL ||
					process.env.BACKEND_URL ||
					'http://localhost:9000';
				const publishable =
					process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
					process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;
				const res = await fetch(
					`${backendUrl}/store/giyapay/transaction?order_id=${order.id}`,
					{
						headers: {
							accept: 'application/json',
							...(publishable
								? { 'x-publishable-api-key': publishable }
								: {}),
						},
					},
				);
				if (res.ok) {
					const data = await res.json();
					setTxn({
						amount: data.amount,
						currency: data.currency,
						description: data.description,
						gateway: (data.gateway || '').toString().toUpperCase(),
						referenceNumber: data.referenceNumber,
						vendorName: data.vendorName,
					});
				}
				// Also detect COD by checking order payments
				const orderRes = await fetch(
					`${backendUrl}/store/orders/${order.id}?fields=%2Apayment_collections.payments`,
					{
						cache: 'no-store',
						headers: {
							accept: 'application/json',
							...(publishable
								? { 'x-publishable-api-key': publishable }
								: {}),
						},
					},
				);
				if (orderRes.ok) {
					const body = await orderRes.json().catch(() => ({}) as any);
					const o = (body?.order || body) as any;
					const providers: string[] = (
						o?.payment_collections?.payments || []
					)
						.map((p: any) => p?.provider_id)
						.filter(Boolean);
					setIsCod(providers.includes('pp_system_default'));
				}
			} catch {}
		};
		run();
	}, [order?.id]);
	return (
		<div className="py-6">
			<div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full mx-auto">
				<div
					className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
					data-testid="order-complete-container"
				>
					<div className="text-center w-full">
						<Heading
							className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
							level="h1"
						>
							<span>Thank you!</span>
							<span>Your order was placed successfully.</span>
						</Heading>

						<Text>
							We have sent the order confirmation details to{' '}
							<span
								className="text-ui-fg-medium-plus font-semibold"
								data-testid="order-email"
							>
								{order.email}
							</span>
							.
						</Text>
					</div>
					{isCod && (
						<div className="mt-2 border rounded-md p-4 bg-ui-button-neutral">
							<Text className="font-medium">
								Payment on Delivery
							</Text>
							<Text className="text-ui-fg-subtle">
								Please prepare cash upon delivery. No payment
								was captured online.
							</Text>
						</div>
					)}
					{txn && (
						<div className="mt-2 grid grid-cols-2 gap-2 border rounded-md p-4">
							<Text className="font-medium">Reference</Text>
							<Text className="font-mono truncate">
								{txn.referenceNumber}
							</Text>
							<Text className="font-medium">Amount</Text>
							<Text>
								{new Intl.NumberFormat('en-PH', {
									currency: txn.currency || 'PHP',
									style: 'currency',
								}).format(txn.amount || 0)}
							</Text>
							<Text className="font-medium">Payment Method</Text>
							<Text>{txn.gateway || '-'}</Text>
							{txn.vendorName && (
								<>
									<Text className="font-medium">Vendor</Text>
									<Text>{txn.vendorName}</Text>
								</>
							)}
							{txn.description && (
								<>
									<Text className="font-medium">
										Description
									</Text>
									<Text>{txn.description}</Text>
								</>
							)}
						</div>
					)}
					{/* <OrderDetails order={order} />
          <OrderItems order={order} />
          <OrderTotals totals={order} />
          <OrderShipping order={order} /> */}
					{/*<PaymentDetails order={order} />
          <Help /> */}
				</div>
			</div>
		</div>
	);
};
