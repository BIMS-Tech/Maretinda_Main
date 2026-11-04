import { ProductPageAccordion } from '@/components/molecules';
import { sanitizeSellerHtml } from '@/lib/helpers/sanitize-html';

export const ProductPageDetails = ({ details }: { details: string }) => {
	if (!details) return null;

	return (
		<ProductPageAccordion defaultOpen={false} heading="Product details">
			<div
				className="product-details"
				dangerouslySetInnerHTML={{
					__html: sanitizeSellerHtml(details),
				}}
			/>
		</ProductPageAccordion>
	);
};
