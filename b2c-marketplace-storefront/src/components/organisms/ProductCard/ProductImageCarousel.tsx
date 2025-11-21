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

	return (
		<div className="slider-product-images w-full max-w-[480px] mx-auto h-[220px] overflow-hidden">
			<Slider {...settings}>
				{slides.map((slide) => (
					<Image
						alt={`${slide ? `slide-${slide.name}` : 'slide'} `}
						className="w-full h-full max-h-[220px] object-cover object-center"
						height={220}
						key={slide.id}
						src={getImageUrl(slide.url)}
						width={295}
					/>
				))}
			</Slider>
		</div>
	);
};

export default ProductImageCarousel;
