'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { isPlainClick, openProduct } from '@/lib/view-transition';
import type { ProductCardData } from '@/types/search';

/** A link to a product whose picture grows into the product page's. */
export function ProductLink({
	product,
	picture,
	className,
	children,
	label,
	tabIndex,
}: {
	product: Pick<ProductCardData, 'id' | 'handle' | 'title' | 'thumbnail' | 'price' | 'original_price'>;
	/** The card's picture, when it has one on screen */
	picture?: () => HTMLElement | null;
	className?: string;
	children: ReactNode;
	label?: string;
	tabIndex?: number;
}) {
	const router = useRouter();
	const { locale } = useParams<{ locale: string }>();
	const href = `/${locale}/products/${product.handle}`;
	return (
		<Link
			aria-label={label}
			className={className}
			href={href}
			onClick={(e) => {
				if (!isPlainClick(e)) return;
				e.preventDefault();
				openProduct(product, picture?.() ?? null, () => router.push(href));
			}}
			tabIndex={tabIndex}
		>
			{children}
		</Link>
	);
}
