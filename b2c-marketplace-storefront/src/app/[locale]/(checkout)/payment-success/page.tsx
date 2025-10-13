'use client';

import { Container, Heading, Text } from '@medusajs/ui';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface PaymentSuccessPageProps {
	params: Promise<{
		locale: string;
	}>;
	searchParams: Promise<{
		nonce?: string;
		order_id?: string;
		refno?: string;
		timestamp?: string;
		amount?: string;
		signature?: string;
		[key: string]: string | undefined;
	}>;
}

export default function PaymentSuccessPage({
	params,
	searchParams,
}: PaymentSuccessPageProps) {
	const router = useRouter();

	// Unwrap params and searchParams using React.use()
	const resolvedParams = use(params);
	const resolvedSearchParams = use(searchParams);

	console.log(
		'[Payment Success] GiyaPay callback received with params:',
		resolvedSearchParams,
	);

	useEffect(() => {
		const handleGiyaPayCallback = async () => {
			const { order_id, refno, nonce, signature, amount, timestamp } =
				resolvedSearchParams;

			// Handle order_id as array or string
			const actualOrderId = Array.isArray(order_id)
				? order_id[0]
				: order_id;

			if (!actualOrderId) {
				console.error('[Payment Success] No order_id provided');
				router.push(`/${resolvedParams.locale}`);
				return;
			}

			console.log(
				'[Payment Success] Processing GiyaPay callback for order:',
				actualOrderId,
			);

			try {
				// Extract cart ID from order ID
				const cartId = actualOrderId.split('%2C')[0].split(',')[0]; // Handle URL-encoded comma

				console.log('[Payment Success] Extracted cart ID:', cartId);
				console.log(
					'[Payment Success] Attempting to complete cart via API...',
				);

				// Call our cart completion API
				const response = await fetch('/api/payment/giyapay/complete', {
					body: JSON.stringify({ cartId }),
					headers: {
						'Content-Type': 'application/json',
					},
					method: 'POST',
				});

				if (response.ok) {
					const result = await response.json();
					console.log('[Payment Success] API response:', result);

					if (result.success && result.orderId) {
						console.log(
							'[Payment Success] Order created successfully:',
							result.orderId,
						);

						// Also forward gateway/vendor info to backend to fix payment method and vendor column
						const gateway = (
							resolvedSearchParams.gateway ||
							resolvedSearchParams.channel ||
							resolvedSearchParams.provider ||
							resolvedSearchParams.payment_method ||
							''
						)
							.toString()
							.toUpperCase();
						const vendor_id = resolvedSearchParams.vendor_id;
						const vendor_name = resolvedSearchParams.vendor_name;
						const description =
							resolvedSearchParams.description ||
							'GiyaPay payment authorization';

						try {
							const params = new URLSearchParams({
								cart_id: cartId || '',
								description: (description as any) || '',
								gateway: gateway || '',
								order_id: result.orderId || '',
								reference_number:
									refno ||
									result.orderId ||
									actualOrderId ||
									'',
								vendor_id: (vendor_id as any) || '',
								vendor_name: (vendor_name as any) || '',
							});
							await fetch(
								`/api/payment/giyapay/update?${params.toString()}`,
							);
						} catch (e) {
							console.warn(
								'[Payment Success] Failed to send update payload:',
								e,
							);
						}
						// Redirect directly to Medusa's built-in order confirmation page
						router.replace(
							`/${resolvedParams.locale}/order/${result.orderId}/confirmed`,
						);
						return;
					}
				} else {
					console.error(
						'[Payment Success] API error:',
						response.status,
						response.statusText,
					);
				}

				throw new Error('Unable to complete order through API');
			} catch (error) {
				console.error(
					'[Payment Success] Error processing callback:',
					error,
				);

				// Redirect to checkout with error message
				router.replace(
					`/${resolvedParams.locale}/checkout?step=payment&error=Payment+processing+failed&reference=${resolvedSearchParams.refno}`,
				);
			}
		};

		handleGiyaPayCallback();
	}, [resolvedSearchParams, resolvedParams.locale, router]);

	// Show minimal processing page while completing order
	const displayOrderId = Array.isArray(resolvedSearchParams.order_id)
		? resolvedSearchParams.order_id[0]
		: resolvedSearchParams.order_id;
	const displayRefno = resolvedSearchParams.refno;
	const displayAmount = resolvedSearchParams.amount;
	const displayGateway = (
		resolvedSearchParams.gateway ||
		resolvedSearchParams.channel ||
		resolvedSearchParams.provider ||
		resolvedSearchParams.payment_method ||
		''
	)
		.toString()
		.toUpperCase();

	return null;
}
