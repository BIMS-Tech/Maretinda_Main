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
		<div className="embla__dots absolute lg:top-3 bottom-3 lg:bottom-auto left-3 w-[calc(100%-24px)] h-[2px]">
			<div className="lg:hidden">
				<Indicator
					maxStep={slides?.length || 0}
					size="large"
					step={selectedIndex + 1}
				/>
			</div>

			<div className="embla relative outline outline-red-500">
				<div
					className="embla__viewport overflow-hidden rounded-xs"
					ref={emblaRef}
				>
					<div className="embla__container h-[350px] lg:h-[680px] flex lg:block">
						{(slides || []).map((slide, index) => (
							<div
								className="mb-3 rounded-sm cursor-pointer w-16 h-16 bg-primary hidden lg:block"
								key={slide.id}
								onClick={() => changeSlideHandler(index)}
							>
								<Image
									alt="Product carousel Indicator"
									className={cn(
										'rounded-sm border-2 transition-color duration-300 hidden lg:block w-16 h-16 object-cover',
										selectedIndex === index
											? 'border-primary'
											: 'border-tertiary',
									)}
									height={64}
									src={decodeURIComponent(slide.url)}
									width={64}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
