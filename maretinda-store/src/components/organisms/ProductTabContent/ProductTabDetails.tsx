import type { HttpTypes } from '@medusajs/types';

import type { AdditionalAttributeProps } from '@/types/product';

const ProductTabDetails = ({
	product,
}: {
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
	};
}) => {
	return (
		<div className="product-details !text-base !text-black">
			<div>
				<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
					Product Details
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
				<h3 className="text-black text-[18px] md:text-[22px] font-semibold mb-4">
					More Information
				</h3>
				<div className="product-details">
					<ul>
						<li>Material: {product.material || 'N/A'}</li>
						{product.metadata &&
							(
								product.metadata as unknown as {
									key: string;
									value: string;
								}[]
							).map((meta: { key: string; value: string }) => (
								<li key={meta.key}>
									{meta.key}: {meta.value}
								</li>
							))}
					</ul>
				</div>
				{/* <div
					className="product-details"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: no need
					dangerouslySetInnerHTML={{
						__html: product?.description || '',
					}}
				/> */}
			</div>
		</div>
	);
};

export default ProductTabDetails;
