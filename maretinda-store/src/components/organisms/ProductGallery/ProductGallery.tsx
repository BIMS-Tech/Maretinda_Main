'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Image from 'next/image';
import { type PointerEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { EASE_OUT, SPRING } from '@/components/motion';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
import { cn } from '@/lib/utils';
import { openingProduct, productPictureReady } from '@/lib/view-transition';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The picture a card's picture grows into; the loading page shows it first. */
export const HERO_CLASS = 'relative aspect-square w-full overflow-hidden rounded-[28px]';

export function ProductGallery({ productId, handle, title, thumbnail, images }: { productId: string; handle: string; title: string; thumbnail: string | null; images: HttpTypes.StoreProduct['images'] }) {
	// The card's own picture first, so what grew into place stays in place
	const all = [...new Set([thumbnail, ...(images ?? []).map((i) => i.url)].filter((u): u is string => !!u))];
	const pictures = all.length ? all : [null];
	const [at, setAt] = useState(0);
	const [direction, setDirection] = useState(1);
	const [zoom, setZoom] = useState(false);
	const [arriving] = useState(() => !!openingProduct(handle));
	const stage = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);

	useIsomorphicLayoutEffect(() => productPictureReady(), []);

	const show = (i: number) => {
		const next = (i + pictures.length) % pictures.length;
		setDirection(i >= at ? 1 : -1);
		setAt(next);
		setZoom(false);
	};

	const track = (e: PointerEvent) => {
		const box = stage.current?.getBoundingClientRect();
		if (!box || e.pointerType !== 'mouse') return;
		stage.current?.style.setProperty('--ox', `${((e.clientX - box.left) / box.width) * 100}%`);
		stage.current?.style.setProperty('--oy', `${((e.clientY - box.top) / box.height) * 100}%`);
		// Only once they move over it: a pointer resting where a card was isn't asking to zoom
		if (!dragging.current) setZoom(true);
	};

	const picture = cardImage(pictures[at]) || '/images/placeholder.svg';

	return (
		<div className="md:sticky md:top-[132px]">
			<div
				aria-label={`${title}, picture ${at + 1} of ${pictures.length}`}
				aria-roledescription="carousel"
				className={cn(HERO_CLASS, 'group', !arriving && 'rise-in')}
				data-product-hero=""
				onKeyDown={(e) => {
					if (e.key === 'ArrowRight') show(at + 1);
					if (e.key === 'ArrowLeft') show(at - 1);
				}}
				onPointerLeave={() => setZoom(false)}
				onPointerMove={track}
				ref={stage}
				role="group"
				style={{ backgroundColor: groundOf(productId), viewTransitionName: 'product-hero' }}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: arrow keys move between the pictures
				tabIndex={pictures.length > 1 ? 0 : undefined}
			>
				<AnimatePresence custom={direction} initial={false} mode="popLayout">
					<m.div
						animate={{ opacity: 1, scale: 1, x: 0 }}
						className={cn('absolute inset-0', pictures.length > 1 && 'cursor-grab touch-pan-y active:cursor-grabbing')}
						drag={pictures.length > 1 ? 'x' : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.22}
						exit={{ opacity: 0, scale: 0.96, x: direction * -46, transition: { duration: 0.25, ease: EASE_OUT } }}
						initial={{ opacity: 0, scale: 0.96, x: direction * 46 }}
						key={at}
						onDragEnd={(_, info) => {
							dragging.current = false;
							if (Math.abs(info.offset.x) < 60 && Math.abs(info.velocity.x) < 400) return;
							show(at + (info.offset.x < 0 ? 1 : -1));
						}}
						onDragStart={() => {
							dragging.current = true;
							setZoom(false);
						}}
						transition={{ duration: 0.5, ease: EASE_OUT }}
					>
						<Image
							alt={title}
							className="pointer-events-none object-contain p-6 mix-blend-multiply transition-transform duration-500 ease-soft sm:p-9"
							draggable={false}
							fill
							priority={at === 0}
							quality={90}
							sizes="(max-width: 768px) 100vw, 620px"
							src={picture}
							style={{ transform: zoom ? 'scale(1.4)' : undefined, transformOrigin: 'var(--ox, 50%) var(--oy, 50%)' }}
						/>
					</m.div>
				</AnimatePresence>

				{pictures.length > 1 && (
					<>
						{([-1, 1] as const).map((step) => (
							<button
								aria-label={step === 1 ? 'Next picture' : 'Previous picture'}
								className={cn(
									'press absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#432C63] opacity-0 shadow-[0_8px_24px_rgba(67,44,99,0.2)] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 md:flex',
									step === 1 ? 'right-4' : 'left-4',
								)}
								key={step}
								onClick={() => show(at + step)}
								style={{ translate: '0 0' }}
								type="button"
							>
								<svg aria-hidden="true" fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="17">
									<path d={step === 1 ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
								</svg>
							</button>
						))}
						<div aria-hidden="true" className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 md:hidden">
							{pictures.map((src, i) => (
								<span className={cn('h-1.5 rounded-full bg-[#432C63] transition-[width,opacity] duration-300', i === at ? 'w-5 opacity-100' : 'w-1.5 opacity-30')} key={src ?? i} />
							))}
						</div>
					</>
				)}
			</div>

			{pictures.length > 1 && (
				<div className="no-scrollbar mt-4 hidden gap-3 overflow-x-auto p-1 md:flex">
					{pictures.map((src, i) => (
						<button
							aria-current={i === at}
							aria-label={`Picture ${i + 1}`}
							className="press relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[18px]"
							key={src ?? i}
							onClick={() => show(i)}
							style={{ backgroundColor: groundOf(productId) }}
							type="button"
						>
							<Image alt="" className={cn('object-contain p-2 mix-blend-multiply transition-opacity duration-300', i !== at && 'opacity-60')} fill sizes="84px" src={cardImage(src) || '/images/placeholder.svg'} />
							{i === at && <m.span className="absolute inset-0 rounded-[18px] ring-2 ring-inset ring-[#432C63]" layoutId="gallery-ring" transition={SPRING} />}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
