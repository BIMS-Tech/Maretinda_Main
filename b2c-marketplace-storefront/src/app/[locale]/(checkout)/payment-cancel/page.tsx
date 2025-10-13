'use client';

import { Button, Container, Heading, Text } from '@medusajs/ui';
import Link from 'next/link';
import { use } from 'react';

interface PaymentCancelPageProps {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{
		cancelled?: string;
		order_id?: string;
		[key: string]: string | undefined;
	}>;
}

export default function PaymentCancelPage({
	params,
	searchParams,
}: PaymentCancelPageProps) {
	const resolvedParams = use(params);
	const resolvedSearchParams = use(searchParams);

	return (
		<Container className="py-16">
			<div className="text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
					<svg
						className="w-8 h-8 text-yellow-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>
				</div>

				<Heading className="mb-4" level="h1">
					Payment Cancelled
				</Heading>

				<Text className="text-gray-600 mb-6">
					You cancelled the payment process. Your cart items are still
					available.
				</Text>

				<div className="space-x-4">
					<Link href={`/${resolvedParams.locale}/checkout`}>
						<Button variant="primary">Complete Payment</Button>
					</Link>

					<Link href={`/${resolvedParams.locale}/cart`}>
						<Button variant="secondary">View Cart</Button>
					</Link>
				</div>

				{resolvedSearchParams.order_id && (
					<div className="mt-6 text-sm text-gray-500">
						<p>Reference: {resolvedSearchParams.order_id}</p>
					</div>
				)}
			</div>
		</Container>
	);
}
