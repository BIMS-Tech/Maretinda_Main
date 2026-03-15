'use client';

import type { HttpTypes } from '@medusajs/types';
import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import { Indicator } from '@/components/atoms';
import { cn } from '@/lib/utils';

export const ProductCarouselIndicator = ({
	slides = [],
	embla: parentEmbla,
}: {
	slides: HttpTypes.StoreProduct['images'];
	embla?: EmblaCarouselType;
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: 'start',
		axis: 'y',
		loop: true,
	});

	const changeSlideHandler = useCallback(
		(index: number) => {
			if (!parentEmbla) return;
			parentEmbla.scrollTo(index);

			if (!emblaApi) return;
			emblaApi.scrollTo(index);
		},
		[parentEmbla, emblaApi],
	);

	const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, []);

	useEffect(() => {
		if (!parentEmbla) return;

		onSelect(parentEmbla);
		parentEmbla.on('reInit', onSelect).on('select', onSelect);
	}, [parentEmbla, onSelect]);

	return (
		<div className="embla__dots w-full -mt-1 lg:mt-6">
			<div className="lg:hidden h-0.5">
				<Indicator
					maxStep={slides?.length || 0}
					size="large"
					step={selectedIndex + 1}
				/>
			</div>

			<div className="embla relative ">
				<div
					className="embla__viewport overflow-hidden rounded-lg"
					// ref={emblaRef}
				>
					<div className="embla__container grid grid-cols-3 gap-6">
						{(slides || []).map((slide, index) => (
							<button
								className="bg-[#F0EEED] rounded-lg cursor-pointer w-full max-w-[182px] h-auto bg-primary hidden lg:block"
								key={slide.id}
								onClick={() => changeSlideHandler(index)}
								type="button"
							>
								<Image
									alt="Product carousel Indicator"
									className={cn(
										'rounded-sm border-2 transition-color duration-300 hidden lg:block w-full max-w-[182px] h-auto object-cover',
										selectedIndex === index
											? 'border-primary'
											: 'border-tertiary',
									)}
									height={182}
									src={decodeURIComponent(slide.url)}
									width={182}
								/>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
