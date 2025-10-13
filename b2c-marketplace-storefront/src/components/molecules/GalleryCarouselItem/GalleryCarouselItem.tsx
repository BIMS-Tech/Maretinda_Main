import Image from 'next/image';

import type { SingleProductImage } from '@/types/product';

export const GalleryCarouselItem = ({
	image,
}: {
	image: SingleProductImage;
}) => {
	return (
		<Image
			alt={image.alt}
			height={700}
			key={image.id}
			src={decodeURIComponent(image.url)}
			width={700}
		/>
	);
};
