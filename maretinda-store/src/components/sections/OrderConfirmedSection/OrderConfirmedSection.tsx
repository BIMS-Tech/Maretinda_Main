'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useState } from 'react';
import { convertToLocale } from '@/lib/helpers/money';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

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
		sellerName?: string;
		description?: string;
	}>(null);

	useEffect(() => {
		const run = async () => {
			try {
				// For marketplace orders, use the order_set ID to lookup transaction
				// Individual orders share the same GiyaPay transaction via the order set
				const orderIdForLookup = (order as any).order_set?.id || order.id;

				console.log('[Order Confirmed] Fetching transaction for:', orderIdForLookup);

				const res = await fetch(
					`/api/giyapay/transaction?order_id=${orderIdForLookup}`,
					{ headers: { accept: 'application/json' } },
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
						sellerName: data.sellerName,
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

	const currency = order.currency_code || 'PHP';
	const orderId = order.id;
	const summaryFields = [
		{ label: 'Order ID', value: `#${order.display_id || order.id?.slice(-8).toUpperCase()}` },
		{ label: 'Payment Method', value: getPaymentMethodName() },
		{ label: 'Transaction ID', value: txn?.referenceNumber || order.id?.slice(-8).toUpperCase() },
		{ label: 'Delivery Date', value: formattedDeliveryDate },
	];

	return (
		<div className="min-h-screen bg-gray-50 py-10 sm:py-14">
			<div className="max-w-3xl mx-auto px-4">
				{/* Header Section */}
				<div className="text-center mb-8">
					<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
						<svg
							className="h-10 w-10 text-green-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2.5}
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Thank You!</h1>
					<p className="text-lg text-gray-700 mb-1">Your order was placed successfully.</p>
					<p className="text-gray-600 text-sm sm:text-base">
						We&apos;ve sent the order confirmation to{' '}
						<span className="font-semibold text-gray-900 break-all">{order.email}</span>.
					</p>
				</div>

				{/* Order Summary Card */}
				<div className="bg-brandPurple text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
						{summaryFields.map((field) => (
							<div key={field.label} className="min-w-0">
								<p className="text-white/60 text-xs font-medium uppercase tracking-wide">{field.label}</p>
								<p className="font-bold text-base sm:text-lg mt-1 break-words">{field.value}</p>
							</div>
						))}
					</div>
				</div>

				{/* Order Details Section */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Order Details</h2>

					{/* Products Header */}
					<div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
						<p className="font-semibold text-gray-500 text-sm uppercase tracking-wide">Products</p>
						<p className="font-semibold text-gray-500 text-sm uppercase tracking-wide">Sub Total</p>
					</div>

					{/* Product Items */}
					<div className="divide-y divide-gray-100 mb-2">
						{order.items?.map((item: any, index: number) => (
							<div key={index} className="flex items-center gap-4 py-4">
								{/* Product Image */}
								<div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
									{(item.thumbnail || item.product?.thumbnail) ? (
										<img
											src={getImageUrl(item.thumbnail || item.product?.thumbnail)}
											alt={item.product?.title || item.title}
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="w-full h-full bg-gray-200 flex items-center justify-center">
											<span className="text-gray-400 text-xs">No Image</span>
										</div>
									)}
								</div>

								{/* Product Details */}
								<div className="flex-1 min-w-0">
									<h3 className="font-semibold text-gray-900 text-base truncate">
										{item.product?.title || item.title}
									</h3>
									{item.variant && (
										<p className="text-gray-500 text-sm truncate">
											Variant: {item.variant.title}
										</p>
									)}
									<p className="text-gray-500 text-sm">
										Qty: <span className="font-medium text-gray-700">{item.quantity}</span>
									</p>
								</div>
								<div className="text-right flex-shrink-0">
									<p className="font-bold text-base text-gray-900">
										{convertToLocale({
											amount: item.total || 0,
											currency_code: currency,
										})}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Order Summary */}
					<div className="border-t border-gray-200 pt-5 mt-2">
						<div className="space-y-3">
							<div className="flex justify-between text-gray-600 text-sm">
								<span>Subtotal</span>
								<span className="font-medium text-gray-800">
									{convertToLocale({ amount: order.item_total || 0, currency_code: currency })}
								</span>
							</div>
							<div className="flex justify-between text-gray-600 text-sm">
								<span>Delivery</span>
								<span className="font-medium text-gray-800">
									{convertToLocale({ amount: order.shipping_total || 0, currency_code: currency })}
								</span>
							</div>
							<div className="flex justify-between text-gray-600 text-sm">
								<span>Coupon Discount</span>
								<span className="font-medium text-gray-800">
									{convertToLocale({ amount: order.discount_total || 0, currency_code: currency })}
								</span>
							</div>
							<div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
								<span>Total</span>
								<span>
									{convertToLocale({ amount: order.total || 0, currency_code: currency })}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Navigation Buttons */}
				<div className="mt-8 flex flex-col sm:flex-row gap-3">
					<LocalizedClientLink
						href="/"
						className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-action text-action-on-primary font-semibold px-6 py-3 text-center transition-colors hover:bg-action-hover"
					>
						<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 002 2 2 2 0 002-2M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
						</svg>
						Continue Shopping
					</LocalizedClientLink>
					<LocalizedClientLink
						href={orderId ? `/user/orders/${orderId}` : '/user/orders'}
						className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brandPurple text-white font-semibold px-6 py-3 text-center transition-colors hover:bg-brandPurple/90"
					>
						<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
						</svg>
						Track Order
					</LocalizedClientLink>
				</div>
			</div>
		</div>
	);
};