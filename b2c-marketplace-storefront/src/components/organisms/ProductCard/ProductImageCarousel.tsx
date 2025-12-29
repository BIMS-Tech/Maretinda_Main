'use client';

import Image from 'next/image';
import type React from 'react';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

import NextButton from '@/components/atoms/Button/NextButton';
import PrevButton from '@/components/atoms/Button/PrevButton';
import { getImageUrl } from '@/lib/helpers/get-image-url';

export type CarouselSlide = {
	id: number;
	url: string;
	name: string;
};

type CarouselProps = {
	slides: CarouselSlide[];
};

const ProductImageCarousel: React.FC<CarouselProps> = ({ slides }) => {
	const settings = {
		autoplay: false,
		dots: false,
		infinite: true,
		nextArrow: <NextButton />,
		pauseOnHover: false,
		prevArrow: <PrevButton />,
		slidesToScroll: 1,
		slidesToShow: 1,
		speed: 300,
	};

	// Filter out slides with invalid URLs and validate URLs
	const validSlides = slides.filter((slide) => {
		if (!slide?.url || typeof slide.url !== 'string') {
			return false;
		}
		const imageUrl = getImageUrl(slide.url);
		// Check if it's a valid URL format
		try {
			if (imageUrl.startsWith('/') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
				return true;
			}
			new URL(imageUrl);
			return true;
		} catch {
			return false;
		}
	});

	// If no valid slides, show a placeholder
	if (validSlides.length === 0) {
		return (
			<div className="slider-product-images w-full max-w-[480px] mx-auto h-[220px] overflow-hidden bg-gray-200 flex items-center justify-center">
				<span className="text-gray-400">No image available</span>
			</div>
		);
	}

	return (
		<div className="slider-product-images w-full max-w-[480px] mx-auto h-[220px] overflow-hidden">
			<Slider {...settings}>
				{validSlides.map((slide) => {
					const imageUrl = getImageUrl(slide.url);
					return (
						<Image
							alt={`${slide ? `slide-${slide.name}` : 'slide'} `}
							className="w-full h-full max-h-[220px] object-cover object-center"
							height={220}
							key={slide.id}
							onError={(e) => {
								console.error('Image load error:', imageUrl);
								// Set fallback image
								const target = e.currentTarget;
								target.src = '/images/placeholder.svg';
							}}
							src={imageUrl}
							width={295}
						/>
					);
				})}
			</Slider>
		</div>
	);
};

export default ProductImageCarousel;
