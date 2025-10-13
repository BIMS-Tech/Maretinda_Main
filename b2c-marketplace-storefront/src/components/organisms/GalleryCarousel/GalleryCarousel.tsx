import type { HttpTypes } from '@medusajs/types';

import { ProductCarousel } from '@/components/cells';

export const GalleryCarousel = ({
	images,
}: {
	images: HttpTypes.StoreProduct['images'];
}) => {
	return (
		<div className="border w-full p-1 rounded-sm">
			<ProductCarousel slides={images} />
		</div>
	);
};
