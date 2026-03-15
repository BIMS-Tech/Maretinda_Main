'use client';

import type { EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

import { Indicator } from '@/components/atoms';
import { ArrowLeftIcon, ArrowRightIcon } from '@/icons';

import tailwindConfig from '../../../../tailwind.config';

export const CustomCarousel = ({
	variant = 'light',
	items,
	align = 'start',
}: {
	variant?: 'light' | 'dark';
	items: React.ReactNode[];
	align?: 'center' | 'start' | 'end';
}) => {
	const [emblaRef, emblaApi] = useEmblaCarousel({
		align,
		loop: true,
	});

	const [selectedIndex, setSelectedIndex] = useState(0);

	const maxStep = items.length;

	const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, []);

	useEffect(() => {
		if (!emblaApi) return;

		onSelect(emblaApi);
		emblaApi.on('reInit', onSelect).on('select', onSelect);
	}, [emblaApi, onSelect]);

	const changeSlideHandler = useCallback(
		(index: number) => {
			if (!emblaApi) return;
			emblaApi.scrollTo(index);
		},
		[emblaApi],
	);

	const arrowColor = {
		dark: tailwindConfig.theme.extend.colors.tertiary,
		light: tailwindConfig.theme.extend.colors.primary,
	};

	return (
		<div className="embla relative w-full flex justify-center -mt-5">
			<div
				className="embla__viewport overflow-hidden rounded-xs w-full xl:flex xl:justify-start"
				ref={emblaRef}
			>
				<div className="embla__container flex justify-start space-x-0">
					{items.map((slide) => slide)}
				</div>

				<div className="flex justify-between items-center mt-4 sm:hidden">
					<div className="w-1/2">
						<Indicator
							maxStep={maxStep}
							step={selectedIndex + 1}
							variant={variant}
						/>
					</div>
					<div>
						<button
							onClick={() =>
								changeSlideHandler(selectedIndex - 1)
							}
						>
							<ArrowLeftIcon color={arrowColor[variant]} />
						</button>
						<button
							onClick={() =>
								changeSlideHandler(selectedIndex + 1)
							}
						>
							<ArrowRightIcon color={arrowColor[variant]} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
