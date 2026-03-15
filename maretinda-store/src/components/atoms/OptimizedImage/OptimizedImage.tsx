'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

import { getImageConfig } from '@/lib/config/image-config';
import { getImageUrl } from '@/lib/helpers/get-image-url';

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
	src: string | null | undefined;
	fallbackSrc?: string;
	placeholderType?: 'product' | 'category' | 'user' | 'seller' | 'general';
}

/**
 * Optimized Image Component with automatic fallback and error handling
 * 
 * Features:
 * - Automatic URL handling (relative, absolute, CDN)
 * - Fallback image on error
 * - Loading states
 * - CDN support
 * - Next.js Image optimization
 */
export const OptimizedImage = ({
	src,
	alt,
	fallbackSrc,
	placeholderType = 'general',
	onError,
	...props
}: OptimizedImageProps) => {
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true);
	const config = getImageConfig();

	// Determine the image source
	const getSource = (): string => {
		// If error occurred and fallback is provided
		if (error && fallbackSrc) {
			return fallbackSrc;
		}
		
		// If error occurred and no fallback, use placeholder
		if (error) {
			return config.placeholders[placeholderType];
		}
		
		// If no src provided, use fallback or placeholder
		if (!src) {
			return fallbackSrc || config.placeholders[placeholderType];
		}
		
		// Process the URL
		const processedUrl = getImageUrl(src);
		
		// If processed URL is empty, use fallback or placeholder
		if (!processedUrl) {
			return fallbackSrc || config.placeholders[placeholderType];
		}
		
		return processedUrl;
	};

	const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		console.warn('Image load error:', src, 'Using fallback');
		setError(true);
		setLoading(false);
		if (onError) {
			onError(e);
		}
	};

	const handleLoad = () => {
		setLoading(false);
	};

	const imageSrc = getSource();

	return (
		<>
			<Image
				{...props}
				alt={alt || 'Image'}
				onError={handleError}
				onLoad={handleLoad}
				src={imageSrc}
			/>
			{loading && (
				<div
					className="absolute inset-0 bg-gray-100 animate-pulse"
					style={{ zIndex: -1 }}
				/>
			)}
		</>
	);
};

export default OptimizedImage;




