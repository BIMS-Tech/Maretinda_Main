import type { HttpTypes } from '@medusajs/types';

import { GalleryCarousel } from '@/components/organisms';

export const ProductGallery = ({
	images,
}: {
	images: HttpTypes.StoreProduct['images'];
}) => {
	return (
		<div>
			<GalleryCarousel images={images} />
		</div>
	);
};
