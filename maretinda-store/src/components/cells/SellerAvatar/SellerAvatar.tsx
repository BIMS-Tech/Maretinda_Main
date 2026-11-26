'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cardImage } from '@/lib/helpers/card-image';

/** A shop's photo, or its initial when it has none or it can't be loaded. */
export const SellerAvatar = ({ photo = '', size = 32, alt = '' }: { photo?: string | null; size?: number; alt?: string }) => {
	const [broken, setBroken] = useState(false);
	const src = cardImage(photo);
	if (src && !broken) {
		return (
			<Image
				alt={alt}
				className="shrink-0 rounded-full object-cover"
				height={size}
				onError={() => setBroken(true)}
				src={src}
				style={{ height: size, width: size }}
				width={size}
			/>
		);
	}
	return (
		<span
			aria-hidden="true"
			className="flex shrink-0 items-center justify-center rounded-full bg-[#432C63] font-bold text-white"
			style={{ fontSize: size * 0.4, height: size, width: size }}
		>
			{(alt || 'S').trim().charAt(0).toUpperCase()}
		</span>
	);
};
