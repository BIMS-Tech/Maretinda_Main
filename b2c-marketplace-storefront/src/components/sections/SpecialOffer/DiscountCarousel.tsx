'use client';

import { ArrowLongRight } from '@medusajs/icons';
import Image from 'next/image';
import type React from 'react';
import { LuApple } from 'react-icons/lu';
import Slider from 'react-slick';

import { Button } from '@/components/atoms';

import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

import NextButton from '@/components/atoms/Button/NextButton';
import PrevButton from '@/components/atoms/Button/PrevButton';

export type CarouselSlide = {
	id: string;
	badgeText: string;
	title: string;
	voucherText: string;
	imageUrl: string;
	ctaText: string;
	ctaLink: string;
};

type CarouselProps = {
	slides: CarouselSlide[];
};

const DiscountCarousel: React.FC<CarouselProps> = ({ slides }) => {
	const settings = {
		autoplay: true,
		dots: true,
		infinite: true,
		nextArrow: <NextButton />,
		pauseOnHover: false,
		prevArrow: <PrevButton />,
		slidesToScroll: 1,
		slidesToShow: 1,
		speed: 500,
	};

	return (
		<div className="slider-container w-full max-w-full mx-auto overflow-hidden">
			<Slider {...settings}>
				{slides.map((slide) => (
					<div className="focus:outline-none" key={slide.id}>
						<div className="bg-black relative h-[450px] sm:h-[465px] text-white">
							<div className="absolute inset-0 z-0 overflow-hidden">
								<Image
									alt={slide.title}
									className="opacity-70 object-cover object-center"
									fill
									// height={465}
									priority
									src={slide.imageUrl}
									// width={1200}
								/>
							</div>

							<div className="relative z-10 flex h-full items-center justify-start p-8 px-16 sm:p-16 sm:px-36">
								<div className="max-w-2xl">
									<div className="flex items-center mb-4 text-gray-300">
										<LuApple className="w-6 h-6 mr-2" />
										<span className="text-lg">
											{slide.badgeText}
										</span>
									</div>

									<h1 className="text-4xl sm:text-5xl font-lora font-bold leading-tight my-4">
										{slide.title}
										<br />
										{slide.voucherText}
									</h1>

									<Button className="mt-6 min-w-[74px] !font-medium text-md px-4 py-2.5 flex items-center rounded-[6px] shadow-md transition-colors ">
										{slide.ctaText}
										<ArrowLongRight className="w-5 h-5 ml-2" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				))}
			</Slider>
		</div>
	);
};

export default DiscountCarousel;
