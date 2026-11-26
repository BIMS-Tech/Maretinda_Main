import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

/**
 * A heading whose words rise into place from behind a line. `play` runs it as
 * soon as the page paints (heroes); otherwise the Reveal around it decides.
 * Screen readers and search engines get the plain sentence.
 */
export function MaskedText({
	text,
	className,
	play = false,
	delay = 0,
	wordClassName,
}: {
	text: string;
	className?: string;
	play?: boolean;
	/** Milliseconds */
	delay?: number;
	wordClassName?: (word: string, index: number) => string | undefined;
}) {
	const list = text.split(/\s+/).filter(Boolean);
	return (
		<span className={cn('masked-text', play && 'masked-text--play', className)} style={{ '--mask-delay': `${delay}ms` } as CSSProperties}>
			{list.map((word, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: the words of one sentence, in order
				<span key={i}>
					<span className="masked-word">
						<span className={wordClassName?.(word, i)} style={{ '--i': i } as CSSProperties}>
							{word}
						</span>
					</span>
					{i < list.length - 1 ? ' ' : ''}
				</span>
			))}
		</span>
	);
}
