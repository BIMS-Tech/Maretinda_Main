'use client';

import Image from 'next/image';
import type React from 'react';
// We'll use the ChevronLeft and ChevronRight icons from 'lucide-react'
import { LuApple, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import Slider, { type Settings } from 'react-slick';

import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

// 🎯 Biome Rule: All types/interfaces in prose must use LaTeX.
/**
 * @type {CarouselSlide} Defines the structure for each slide's data.
 */
export type CarouselSlide = {
	id: string;
	badgeText: string;
	title: string;
	voucherText: string;
	imageUrl: string;
	ctaText: string;
	ctaLink: string;
};

/**
 * @type {CarouselProps} Defines the props for the DiscountCarousel component.
 */
type CarouselProps = {
	slides: CarouselSlide[];
};

// --- Custom Navigation Arrows ---

/**
 * Custom Next Arrow Component for react-slick
 * This replicates the circular semi-transparent arrow styling from the image.
 * @param props - slick arrow props
 */
const NextArrow: React.FC<any> = ({ className, style, onClick }) => (
	// We override react-slick's default classes to apply Tailwind styling
	<button
		// Tailwind classes applied directly to replicate the white, semi-transparent circle.
		// We use '!block' to override the default slick-next/slick-prev styling.
		aria-label="Next slide"
		className={`${className} !block absolute right-0 top-1/2 transform -translate-y-1/2 z-20 cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors`}
		onClick={onClick}
		style={{ ...style }}
		type="button"
	>
		<LuChevronRight className="w-6 h-6 text-white" />
	</button>
);

/**
 * Custom Prev Arrow Component for react-slick
 * @param props - slick arrow props
 */
const PrevArrow: React.FC<any> = ({ className, style, onClick }) => (
	<button
		aria-label="Previous slide"
		className={`${className} !block absolute left-0 top-1/2 transform -translate-y-1/2 z-20 cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors`}
		onClick={onClick}
		style={{ ...style }}
		type="button"
	>
		<LuChevronLeft className="w-6 h-6 text-white" />
	</button>
);

// --- Main Carousel Component ---

const DiscountCarousel: React.FC<CarouselProps> = ({ slides }) => {
	// Biome: Formatting - ensures `indentWidth` is followed (4 spaces in this config)
	// Biome: Formatting - ensures `quoteStyle` for JS is 'single'
	const settings: Settings = {
		// Customizing the dots to match the image's style (small, gray circles)
		// appendDots: (dots: React.ReactNode) => (
		// 	<div className="absolute bottom-0 left-0 right-0">
		// 		<ul className="flex justify-center space-x-2 p-0 m-0 list-none">
		// 			{dots}
		// 		</ul>
		// 	</div>
		// ),
		autoplay: true,
		autoplaySpeed: 5000,
		customPaging: (i: number) => (
			// The dots style from the image suggests a small, filled circle.
			<div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-gray-400 transition-colors cursor-pointer"></div>
		),
		dots: true,
		infinite: true,
		nextArrow: <NextArrow />,
		pauseOnHover: false,
		prevArrow: <PrevArrow />,
		slidesToScroll: 1,
		slidesToShow: 1,
		speed: 500,
		// We need to override slick's internal active dot class for Tailwind
		// This requires adding custom CSS to your global or imported stylesheet
	};

	return (
		// Max width set for aesthetic containment, adjust as needed.
		<div className="w-full max-w-full mx-auto overflow-hidden">
			<Slider {...settings}>
				{slides.map((slide) => (
					// key property ensures optimal list rendering performance in React.
					<div className="focus:outline-none" key={slide.id}>
						<div className="bg-black relative h-[450px] sm:h-[550px] text-white">
							{/* --- Background Image (Right side content in the image) --- */}
							{/* We use a utility class to position the image to the right/center 
                and ensure it fills its container for performance/SEO via Next Image. */}
							<div className="absolute inset-0 z-0 overflow-hidden">
								<Image
									alt={slide.title} // Use the specific image URL for the slide
									className="opacity-70"
									// fill
									height={465}
									// Opacity is slightly reduced to let the text pop, as seen in the image.
									priority
									src={slide.imageUrl}
									style={{
										objectFit: 'cover',
										objectPosition: 'center right',
									}}
									width={1200}
								/>
							</div>

							{/* --- Content Overlay (Left side text in the image) --- */}
							<div className="relative z-10 flex h-full items-center justify-start p-8 sm:p-16">
								<div className="max-w-xl">
									{/* Badge Text: Apple Logo + "iPhone 14 Series" */}
									<div className="flex items-center mb-4 text-gray-300">
										<LuApple className="w-6 h-6 mr-2" />
										<span className="text-lg">
											{slide.badgeText}
										</span>
									</div>

									{/* Main Header Text */}
									<h1 className="text-5xl sm:text-7xl font-bold leading-tight my-4">
										{/* The title and voucher text are split into two lines in the image */}
										{slide.title}
										<br />
										{slide.voucherText}
									</h1>

									{/* CTA Button */}
									{/* The button uses a distinctive yellow background per the image */}
									<a
										className="mt-6 inline-flex items-center px-8 py-3 bg-yellow-400 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-500 transition-colors text-lg"
										href={slide.ctaLink}
										role="button"
									>
										{slide.ctaText}
										<LuChevronRight className="w-5 h-5 ml-2" />
									</a>
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
