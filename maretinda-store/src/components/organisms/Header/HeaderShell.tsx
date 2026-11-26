'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Stays with the page; the category strip slides away under it going down and
 * returns going up. The strip is laid over the page, so moving it never
 * shifts what is being read.
 */
export function HeaderShell({ children, strip }: { children: ReactNode; strip: ReactNode }) {
	const [scrolled, setScrolled] = useState(false);
	const [tucked, setTucked] = useState(false);

	useEffect(() => {
		let last = window.scrollY;
		let frame = 0;
		const update = () => {
			frame = 0;
			const y = Math.max(0, window.scrollY);
			setScrolled(y > 40);
			// A few pixels of wobble isn't a change of direction
			if (Math.abs(y - last) < 10) return;
			setTucked(y > last && y > 180);
			last = y;
		};
		const onScroll = () => {
			frame ||= requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
		};
	}, []);

	return (
		<>
			<header className="sticky top-0 z-40">
				<div className={cn('relative z-10 bg-[#432C63] transition-shadow duration-500', scrolled && tucked && 'shadow-[0_10px_34px_rgba(30,20,48,0.28)]')}>{children}</div>
				<div
					className={cn(
						'absolute inset-x-0 top-full hidden bg-[#432C63] transition-[transform,box-shadow] duration-500 ease-soft md:block',
						tucked && '-translate-y-full',
						scrolled && !tucked && 'shadow-[0_10px_34px_rgba(30,20,48,0.28)]',
					)}
					inert={tucked}
				>
					{strip}
				</div>
			</header>
			{/* Where the strip rests */}
			<div aria-hidden="true" className="hidden h-[45px] bg-[#432C63] md:block" />
		</>
	);
}
