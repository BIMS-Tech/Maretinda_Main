'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';

import { MaskedText, peso } from '@/components/motion';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
import { openingProduct, productPictureReady } from '@/lib/view-transition';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The product page while it loads: what its card already knew, in place. */
export function ProductLoading() {
	const { handle } = useParams<{ handle: string }>();
	const [known] = useState(() => openingProduct(handle));
	useIsomorphicLayoutEffect(() => productPictureReady(), []);
	const image = cardImage(known?.thumbnail);

	return (
		<div aria-busy="true" role="status">
			<span className="sr-only">Loading product</span>
			<div className="mb-6 hidden h-5 md:block" />
			<div className="flex flex-col gap-8 md:flex-row lg:gap-14">
				<div className="md:w-[46%]">
					<div className="relative aspect-square w-full overflow-hidden rounded-[28px]" style={{ backgroundColor: groundOf(known?.id ?? ''), viewTransitionName: 'product-hero' }}>
						{image ? (
							<Image alt="" className="object-contain p-6 mix-blend-multiply sm:p-9" fill priority quality={90} sizes="(max-width: 768px) 100vw, 620px" src={image} />
						) : (
							<div className="shimmer absolute inset-0" />
						)}
					</div>
				</div>
				<div className="flex flex-col gap-5 md:w-[54%]">
					{known ? (
						<p className="font-serif text-[32px] leading-[1.12] tracking-[-0.01em] text-[#1B1B1B] lg:text-[42px]">
							<MaskedText play text={known.title} />
						</p>
					) : (
						<div className="shimmer h-11 w-3/4 rounded-xl" />
					)}
					<div className="shimmer h-4 w-32 rounded-full" />
					{known?.price != null ? <p className="rise-in text-[28px] font-extrabold tracking-tight text-[#432C63]">{peso(known.price)}</p> : <div className="shimmer h-8 w-32 rounded-xl" />}
					<div className="space-y-2.5">
						<div className="shimmer h-3.5 w-full rounded-full" />
						<div className="shimmer h-3.5 w-5/6 rounded-full" />
					</div>
					<div className="flex gap-2.5">
						{[0, 1, 2, 3].map((i) => <div className="shimmer h-11 w-14 rounded-full" key={i} />)}
					</div>
					<div className="shimmer h-[52px] w-full rounded-full" />
				</div>
			</div>
		</div>
	);
}
