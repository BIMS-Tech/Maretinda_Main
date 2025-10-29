import type { HttpTypes } from '@medusajs/types';

import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';

const ProductTabRating = ({
	product,
}: {
	product: HttpTypes.StoreProduct & {
		seller?: SellerProps;
		attribute_values?: AdditionalAttributeProps[];
	};
}) => {
	return (
		<div className="product-details !text-base !text-black">
			<div>
				<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
					Customer Reviews (2)
				</h3>
				<div
					className="product-details"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: no need
					dangerouslySetInnerHTML={{
						__html: product?.description || '',
					}}
				/>
			</div>

			<div className="mt-6">
				<h3 className="text-black text-[18px] md:text-[22px]  font-semibold mb-4">
					Returns
				</h3>
				<div
					className="product-details"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: no need
					dangerouslySetInnerHTML={{
						__html: product?.description || '',
					}}
				/>
			</div>
		</div>
	);
};

export default ProductTabRating;
