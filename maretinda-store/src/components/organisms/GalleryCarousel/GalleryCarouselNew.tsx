// import type { HttpTypes } from '@medusajs/types';
// import type React from 'react';
// import { useEffect, useRef, useState } from 'react';
// import Slider, { type Settings } from 'react-slick'; // Import Settings type

// import 'slick-carousel/slick/slick-theme.css';
// import 'slick-carousel/slick/slick.css';

// // 1. Define the correct type for the Slider instance (it's a class component)
// type SlickSlider = Slider | null;

// // Helper type for the props
// interface GalleryCarouselProps {
// 	images: HttpTypes.StoreProduct['images'];
// }

// export const GalleryCarouselNew: React.FC<GalleryCarouselProps> = ({
// 	images,
// }) => {
// 	// 2. Use useRef with the correct type. No need to initialize to null explicitly
// 	//    if you use the type argument, but the explicit type is clearer.
// 	const sliderRef1 = useRef<SlickSlider>(null);
// 	const sliderRef2 = useRef<SlickSlider>(null);

// 	// 3. useState should also use the correct type.
// 	const [nav1, setNav1] = useState<SlickSlider>(null);
// 	const [nav2, setNav2] = useState<SlickSlider>(null);

// 	useEffect(() => {
// 		// 4. Update state with the .current value of the refs
// 		setNav1(sliderRef1.current);
// 		setNav2(sliderRef2.current);
// 	}, []);

// 	// Placeholder data (as you didn't provide product slides)
// 	const slideContent = images?.map((image, index) => (
// 		<div
// 			className="h-16 bg-gray-200 flex items-center justify-center"
// 			key={`${index}-id`}
// 		>
// 			<h3>{image}</h3>
// 		</div>
// 	));

// 	// Optional: Define settings for type safety and clearer structure
// 	const mainSettings: Settings = {
// 		asNavFor: nav2 as Slider | undefined, // Cast required by react-slick's types
// 		slidesToShow: 1,
// 		swipeToSlide: true,
// 	};

// 	const thumbnailSettings: Settings = {
// 		asNavFor: nav1 as Slider | undefined, // Cast required by react-slick's types
// 		focusOnSelect: true,
// 		slidesToShow: 3,
// 		swipeToSlide: true,
// 	};

// 	return (
// 		<div className="border w-full max-w-lg mx-auto p-4 rounded-lg shadow-xl">
// 			<h2 className="text-xl font-bold mb-4">Product Gallery</h2>

// 			{/* --- Main Slider (Image View) --- */}
// 			<h4 className="text-gray-600 mb-2">Main View</h4>
// 			<Slider {...mainSettings} ref={sliderRef1}>
// 				{/* 5. Assign the ref object directly */}
// 				{/* Replace placeholders with actual image content using 'images' prop */}
// 				{slideContent}
// 			</Slider>

// 			{/* --- Thumbnail Slider (Navigation) --- */}
// 			<h4 className="text-gray-600 mt-6 mb-2">Thumbnails</h4>
// 			<Slider {...thumbnailSettings} ref={sliderRef2}>
// 				{/* 5. Assign the ref object directly */}
// 				{/* Replace placeholders with actual image content using 'images' prop */}
// 				{slideContent}
// 			</Slider>
// 		</div>
// 	);
// };

'use client';

import type { HttpTypes } from '@medusajs/types';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Slider, { type Settings } from 'react-slick';

import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

// 1. Define the correct type for the Slider instance
type SlickSlider = Slider | null;

// The image object type from Medusa is likely similar to this:
// type StoreProductImage = HttpTypes.StoreProduct['images'][images];

// Helper type for the props
interface GalleryCarouselProps {
	images: HttpTypes.StoreProduct['images']; // Adjusting for nullable array
}

export const GalleryCarouselNew: React.FC<GalleryCarouselProps> = ({
	images,
}) => {
	// let sliderRef1 = useRef<SlickSlider>(null);
	// let sliderRef2 = useRef<SlickSlider>(null);

	// const [nav1, setNav1] = useState<SlickSlider>(null);
	// const [nav2, setNav2] = useState<SlickSlider>(null);

	// useEffect(() => {
	// 	setNav1(sliderRef1.current);
	// 	setNav2(sliderRef2.current);
	// }, []);
	const sliderRef1 = useRef<Slider | null>(null);
	const sliderRef2 = useRef<Slider | null>(null);

	// 2. State to hold the current slider instances for navigation
	//    We use the state to trigger a re-render once the refs are set.
	const [nav1, setNav1] = useState<Slider | undefined>(undefined);
	const [nav2, setNav2] = useState<Slider | undefined>(undefined);

	// 3. Effect to set the navigation state once the refs are ready
	useEffect(() => {
		setNav1(sliderRef1.current || undefined);
		setNav2(sliderRef2.current || undefined);
	}, []); // Run only once after initial render

	// ⭐️ FIX: Map the images array to actual <img> tags, assuming 'url' property exists
	const slideContent = images?.map((image, index) => (
		<div className="p-1 w-[610px] h-[560px] " key={image.id || index}>
			{/* We must use image.url or image.src property for the <img> element.
                This assumes your StoreProductImage type has a 'url' property.
            */}
			<img
				alt={`Product image ${index + 1}`}
				className="w-full object-cover rounded-lg shadow-md h-full max-h-[560px] lg:h-[600px] transition-opacity duration-300"
				// Tailwind classes for the main image slider items
				src={image.url}
			/>
		</div>
	));

	// Map for thumbnail navigation (usually smaller images)
	const thumbnailContent = images?.map((image, index) => (
		<div
			className="p-1 cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
			key={image.id || `thumb-${index}`}
		>
			<img
				alt={`Thumbnail ${index + 1}`}
				className="w-full object-cover h-20 rounded-md border-2 border-transparent focus:border-blue-500"
				// Tailwind classes for the thumbnail slider items
				src={image.url}
			/>
		</div>
	));

	const mainSettings: Settings = {
		arrows: false, // Often remove arrows on the main slider when using thumbnails
		asNavFor: nav2 as Slider,
		slidesToShow: 1,
		swipeToSlide: true,
	};

	const thumbnailSettings: Settings = {
		asNavFor: nav1 as Slider,
		// Add minimal arrow styling if needed, or stick to focusOnSelect navigation
		className: 'thumbnail-slider',
		focusOnSelect: true,
		infinite: (images?.length || 0) > 4, // Only allow infinite if enough slides
		slidesToShow: 3, // Increased to 4 for better visual navigation
		swipeToSlide: true,
	};

	return (
		<div className="slider-container w-full">
			{/* --- Main Slider (Image View) --- */}
			<div className="mb-4 relative">
				{/* <Slider {...mainSettings} ref={sliderRef1}> */}
				<Slider asNavFor={nav2} ref={sliderRef1}>
					{slideContent || <div>No Images Available</div>}
				</Slider>
			</div>

			{/* --- Thumbnail Slider (Navigation) --- */}
			<div className="mt-4">
				{/* <Slider {...thumbnailSettings} ref={sliderRef2}> */}
				<Slider
					asNavFor={nav1} // Uses the state variable `nav1`
					focusOnSelect={true}
					ref={sliderRef2} // Assigns the ref object
					slidesToShow={3}
					swipeToSlide={true}
				>
					{thumbnailContent || <div>Loading Thumbnails...</div>}
				</Slider>
			</div>
		</div>
	);
};
