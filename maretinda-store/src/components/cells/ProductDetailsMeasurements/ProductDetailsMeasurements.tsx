import {
	ProductPageAccordion,
	ProdutMeasurementRow,
} from '@/components/molecules';
import type { SingleProductMeasurement } from '@/types/product';

export const ProductDetailsMeasurements = ({
	measurements,
}: {
	measurements: SingleProductMeasurement[];
}) => {
	return (
		<ProductPageAccordion defaultOpen={false} heading="Measurements">
			{measurements.map((item) => (
				<ProdutMeasurementRow key={item.label} measurement={item} />
			))}
		</ProductPageAccordion>
	);
};
