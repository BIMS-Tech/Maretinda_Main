'use client';

import Image from 'next/image';
import { useState } from 'react';

/** The featured product's picture; a stand-in if it can't be loaded. */
export const HeroPicture = ({ src, alt, fallback }: { src: string; alt: string; fallback: string }) => {
	const [shown, setShown] = useState(src);
	return (
		<Image
			alt={alt}
			className="image-settle object-cover object-center"
			fill
			onError={() => setShown(fallback)}
			priority
			sizes="(min-width: 1024px) 40vw, 100vw"
			src={shown}
			style={{ '--delay': '180ms' } as React.CSSProperties}
			unoptimized={shown.startsWith('http')}
		/>
	);
};
