'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useState } from 'react';
import { convertToLocale } from '@/lib/helpers/money';
import { getImageUrl } from '@/lib/helpers/get-image-url';

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

	useEffect(() => {
		const run = async () => {
			try {
				const backendUrl =
					process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
					process.env.NEXT_PUBLIC_BACKEND_URL ||
					process.env.BACKEND_URL ||
					'http://localhost:9000';
				const publishable =
					process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
					process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
					'pk_3ad019daf80f5cf6368abbb8bcae8f5694b15a8480728313ba87fd2e6eb02036';
				
				// For marketplace orders, use the order_set ID to lookup transaction
				// Individual orders share the same GiyaPay transaction via the order set
				const orderIdForLookup = (order as any).order_set?.id || order.id;
				
				console.log('[Order Confirmed] Fetching transaction for:', orderIdForLookup);
				
				const res = await fetch(
					`${backendUrl}/store/giyapay/transaction?order_id=${orderIdForLookup}`,
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
					console.log('[Order Confirmed] Transaction found:', data);
					setTxn({
						amount: data.amount,
						currency: data.currency,
						description: data.description,
						gateway: (data.gateway || '').toString().toUpperCase(),
						referenceNumber: data.referenceNumber,
						vendorName: data.vendorName,
					});
				} else {
					console.log('[Order Confirmed] Transaction not found, will use payment collection data');
				}
			} catch (error) {
				console.log('[Order Confirmed] Error fetching transaction:', error);
			}
		};
		run();
	}, [order?.id]);

	// Format delivery date (estimated 3-5 business days from now)
	const deliveryDate = new Date();
	deliveryDate.setDate(deliveryDate.getDate() + 5);
	const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	// Get payment method name
	const getPaymentMethodName = () => {
		if (txn?.gateway) {
			return txn.gateway;
		}
		// Fallback to order payment collection
		const paymentSession = order.payment_collections?.[0]?.payment_sessions?.[0];
		if (paymentSession?.provider_id) {
			const providerId = paymentSession.provider_id;
			if (providerId.includes('gcash')) return 'GCash';
			if (providerId.includes('visa')) return 'Visa';
			if (providerId.includes('mastercard')) return 'Mastercard';
			if (providerId.includes('instapay')) return 'InstaPay';
			if (providerId.includes('paymaya')) return 'PayMaya';
			if (providerId.includes('giyapay')) return 'GiyaPay';
			if (providerId.includes('stripe')) return 'Credit Card';
		}
		return 'Online Payment';
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* Header Section */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h1>
					<p className="text-xl text-gray-700 mb-2">Your order was placed successfully.</p>
					<p className="text-gray-600">
						We have sent the order confirmation details to{' '}
						<span className="font-semibold text-gray-900">{order.email}</span>.
					</p>
				</div>

				{/* Order Summary Card */}
				<div className="bg-purple-600 text-white rounded-lg p-6 mb-8">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<p className="text-purple-200 text-sm font-medium">Order ID</p>
							<p className="font-bold text-lg">#{order.display_id || order.id?.slice(-8).toUpperCase()}</p>
						</div>
						<div>
							<p className="text-purple-200 text-sm font-medium">Payment Method</p>
							<p className="font-bold text-lg">{getPaymentMethodName()}</p>
						</div>
						<div>
							<p className="text-purple-200 text-sm font-medium">Transaction ID</p>
							<p className="font-bold text-lg">{txn?.referenceNumber || order.id?.slice(-8).toUpperCase()}</p>
						</div>
						<div>
							<p className="text-purple-200 text-sm font-medium">Delivery Date</p>
							<p className="font-bold text-lg">{formattedDeliveryDate}</p>
						</div>
					</div>
				</div>

				{/* Order Details Section */}
				<div className="bg-white rounded-lg shadow-sm border p-6">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
					
					{/* Products Header */}
					<div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-200 mb-4">
						<div className="col-span-6">
							<p className="font-semibold text-gray-900">Products</p>
						</div>
						<div className="col-span-6">
							<p className="font-semibold text-gray-900 text-right">Sub Total</p>
						</div>
					</div>

					{/* Product Items */}
					<div className="space-y-4 mb-6">
						{order.items?.map((item: any, index: number) => (
							<div key={index} className="flex items-center gap-4">
								{/* Product Image */}
								<div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
									{item.product?.thumbnail ? (
										<img
											src={getImageUrl(item.product.thumbnail)}
											alt={item.product.title}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-gray-200 flex items-center justify-center">
											<span className="text-gray-400 text-xs">No Image</span>
										</div>
									)}
								</div>

								{/* Product Details */}
								<div className="flex-1 grid grid-cols-12 gap-4 items-center">
									<div className="col-span-6">
										<h3 className="font-semibold text-gray-900 text-lg">
											{item.product?.title || item.title}
										</h3>
										{item.variant && (
											<p className="text-gray-600 text-sm">
												Variant: {item.variant.title}
											</p>
										)}
										<p className="text-gray-500 text-sm">
											Quantity: <span className="font-medium">{item.quantity}</span>
										</p>
									</div>
									<div className="col-span-6 text-right">
										<p className="font-bold text-lg text-gray-900">
											{convertToLocale({
												amount: item.total || 0,
												currency_code: order.currency_code || 'USD',
											})}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Order Summary */}
					<div className="border-t border-gray-200 pt-6">
						<div className="space-y-3">
							<div className="flex justify-between text-gray-700">
								<span className="font-semibold">Subtotal:</span>
								<span className="font-semibold">
									{convertToLocale({
										amount: order.item_total || 0,
										currency_code: order.currency_code || 'USD',
									})}
								</span>
							</div>
							<div className="flex justify-between text-gray-700">
								<span className="font-semibold">Delivery:</span>
								<span className="font-semibold">
									{convertToLocale({
										amount: order.shipping_total || 0,
										currency_code: order.currency_code || 'USD',
									})}
								</span>
							</div>
							<div className="flex justify-between text-gray-700">
								<span className="font-semibold">Coupon Discount:</span>
								<span className="font-semibold">
									{convertToLocale({
										amount: order.discount_total || 0,
										currency_code: order.currency_code || 'USD',
									})}
								</span>
							</div>
							<div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
								<span>Total</span>
								<span>
									{convertToLocale({
										amount: order.total || 0,
										currency_code: order.currency_code || 'USD',
									})}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};