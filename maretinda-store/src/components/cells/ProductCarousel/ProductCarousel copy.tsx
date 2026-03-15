'use client';

import type { HttpTypes } from '@medusajs/types';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

import { ProductCarouselIndicator } from '@/components/molecules';
import { useScreenSize } from '@/hooks/useScreenSize';

export const ProductCarousel = ({
	slides = [],
}: {
	slides: HttpTypes.StoreProduct['images'];
}) => {
	const screenSize = useScreenSize();

	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: 'start',
		axis:
			screenSize === 'xs' || screenSize === 'sm' || screenSize === 'md'
				? 'x'
				: 'y',
		loop: true,
	});

	return (
		<div className="embla relative">
			<div
				className="embla__viewport overflow-hidden rounded-xs"
				ref={emblaRef}
			>
				<div className="h-[350px] lg:h-fit max-h-[698px] flex lg:block">
					{(slides || []).map((slide) => (
						<div
							className="embla__slide min-w-0 h-[350px] lg:h-fit"
							key={slide.id}
						>
							<Image
								alt="Product image"
								className="max-h-[700px] w-full h-auto aspect-square object-cover object-center object-center"
								height={560}
								quality={100}
								src={decodeURIComponent(slide.url)}
								width={615}
							/>
						</div>
					))}
				</div>
				{slides?.length ? (
					<ProductCarouselIndicator
						embla={emblaApi}
						slides={slides}
					/>
				) : null}
			</div>
		</div>
	);
};
