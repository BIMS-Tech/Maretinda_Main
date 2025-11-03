import type { HttpTypes } from '@medusajs/types';

import type { AdditionalAttributeProps } from '@/types/product';

const ProductTabShipping = ({
	product,
}: {
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
	};
}) => {
	return (
		<div className="product-details !text-base !text-black">
			<div>
				<h3 className="text-black  text-[18px] md:text-[22px] font-semibold mb-4">
					Shipping Details
				</h3>
				{/* <div
					className="product-details"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: no need
					dangerouslySetInnerHTML={{
						__html: product?.description || '',
					}}
				/> */}
				<div className="product-details">
					<ul>
						<li>
							Estimated Shipping Dimensions: {product.length}L x{' '}
							{product.width}W x {product.height}H
						</li>
						<li>Estimated Ship Weight: {product.weight}lbs</li>
						<li>Shipping Origin: {product.origin_country}</li>
					</ul>
				</div>
			</div>

			<div className="mt-6">
				<h3 className="text-black  text-[18px] md:text-[22px] font-semibold mb-4">
					Returns
				</h3>
				<div className="product-details">
					<ul>
						<li>
							Estimated Shipping Dimensions: {product.length}L x{' '}
							{product.width}W x {product.height}H
						</li>
						<li>Estimated Ship Weight: {product.weight}lbs</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default ProductTabShipping;
