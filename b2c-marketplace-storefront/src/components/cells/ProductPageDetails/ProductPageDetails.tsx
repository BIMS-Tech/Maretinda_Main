import { ProductPageAccordion } from '@/components/molecules';

export const ProductPageDetails = ({ details }: { details: string }) => {
	if (!details) return null;

	return (
		<ProductPageAccordion defaultOpen={false} heading="Product details">
			<div
				className="product-details"
				dangerouslySetInnerHTML={{
					__html: details,
				}}
			/>
		</ProductPageAccordion>
	);
};
