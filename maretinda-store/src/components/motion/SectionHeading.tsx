import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { MaskedText } from './MaskedText';
import { Reveal } from './Reveal';

export function SectionHeading({
	text,
	as = 'h2',
	className,
	eyebrow,
	eyebrowClassName,
	children,
}: {
	text: string;
	as?: 'h1' | 'h2' | 'h3';
	className?: string;
	eyebrow?: ReactNode;
	eyebrowClassName?: string;
	children?: ReactNode;
}) {
	return (
		<Reveal variant="mask">
			{eyebrow && (
				<div className={cn('eyebrow mb-1.5 text-[11.5px] font-bold tracking-[0.18em] uppercase text-[#432C63]', eyebrowClassName)}>
					{eyebrow}
				</div>
			)}
			{as === 'h1' ? (
				<h1 className={className}><MaskedText text={text} /></h1>
			) : as === 'h3' ? (
				<h3 className={className}><MaskedText text={text} /></h3>
			) : (
				<h2 className={className}><MaskedText text={text} /></h2>
			)}
			{children}
		</Reveal>
	);
}
