'use client';

import { Button, Container, Heading, Text } from '@medusajs/ui';
import Link from 'next/link';
import { use } from 'react';

interface PaymentErrorPageProps {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{
		error?: string;
		order_id?: string;
		[key: string]: string | undefined;
	}>;
}

export default function PaymentErrorPage({
	params,
	searchParams,
}: PaymentErrorPageProps) {
	const resolvedParams = use(params);
	const resolvedSearchParams = use(searchParams);

	const errorMessage = resolvedSearchParams.error || 'Payment failed';

	return (
		<Container className="py-16">
			<div className="text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
					<svg
						className="w-8 h-8 text-red-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M6 18L18 6M6 6l12 12"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>
				</div>

				<Heading className="mb-4" level="h1">
					Payment Failed
				</Heading>

				<Text className="text-gray-600 mb-6">
					{decodeURIComponent(errorMessage)}
				</Text>

				<div className="space-x-4">
					<Link href={`/${resolvedParams.locale}/checkout`}>
						<Button variant="primary">Try Again</Button>
					</Link>

					<Link href={`/${resolvedParams.locale}`}>
						<Button variant="secondary">Continue Shopping</Button>
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
