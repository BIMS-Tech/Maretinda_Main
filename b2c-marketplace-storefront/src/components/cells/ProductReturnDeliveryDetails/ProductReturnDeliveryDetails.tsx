import { ProductPageAccordionMultiple } from '@/components/molecules';
import { ReturnIcon2 } from '@/icons';

export const ProductReturnDeliveryDetails = () => {
	return (
		<ProductPageAccordionMultiple
			defaultOpen={false}
			heading="Return Delivery"
			icon={<ReturnIcon2 />}
		>
			<div className="product-details">
				<ul>
					<li>
						Free standard shipping on all orders within the
						continental U.S. Expedited shipping options are
						available at an additional cost. Orders typically ship
						within 3-5 business days.
					</li>
					<li>
						We offer a 30-day return policy. If you are not
						completely satisfied with your purchase, you can return
						the chair for a full refund or exchange, provided it is
						in its original condition and packaging.
					</li>
				</ul>
			</div>
		</ProductPageAccordionMultiple>
	);
};
