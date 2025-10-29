import type { HttpTypes } from '@medusajs/types';

import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';

const ProductTabShipping = ({
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
							Free standard shipping on all orders within the
							continental U.S. Expedited shipping options are
							available at an additional cost. Orders typically
							ship within 3-5 business days.
						</li>
						<li>
							We offer a 30-day return policy. If you are not
							completely satisfied with your purchase, you can
							return the chair for a full refund or exchange,
							provided it is in its original condition and
							packaging.
						</li>
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
							Free standard shipping on all orders within the
							continental U.S. Expedited shipping options are
							available at an additional cost. Orders typically
							ship within 3-5 business days.
						</li>
						<li>
							We offer a 30-day return policy. If you are not
							completely satisfied with your purchase, you can
							return the chair for a full refund or exchange,
							provided it is in its original condition and
							packaging.
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default ProductTabShipping;
