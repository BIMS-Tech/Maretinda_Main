import { ProductPageAccordion } from '@/components/molecules';
import type { AdditionalAttributeProps } from '@/types/product';

export const ProductAdditionalAttributes = ({
	attributes,
}: {
	attributes: AdditionalAttributeProps[];
}) => {
	if (!attributes.length) return null;

	return (
		<ProductPageAccordion
			defaultOpen={false}
			heading="Additional attributes"
		>
			{attributes.map((attribute) => (
				<div
					className="border rounded-sm grid grid-cols-2 text-center label-md"
					key={attribute.id}
				>
					<div className="border-r py-3">
						{attribute.attribute.name}
					</div>
					<div className="py-3">{attribute.value}</div>
				</div>
			))}
		</ProductPageAccordion>
	);
};
