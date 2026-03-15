import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Cart } from '@/components/sections';

export const metadata: Metadata = {
	description: 'My cart page',
	title: 'Cart',
};

export default function CartPage({}) {
	return (
		<main className="container !max-w-7xl mx-auto px-4 !py-14">
			<Suspense fallback={<>Loading...</>}>
				<Cart />
			</Suspense>
		</main>
	);
}
