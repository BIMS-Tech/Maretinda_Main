import type { HttpTypes } from '@medusajs/types';

import type { AdditionalAttributeProps } from '@/types/product';

const ProductTabDetails = ({
	product,
}: {
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
	};
}) => {
	const metaItems = product.metadata
		? (
				product.metadata as unknown as {
					key: string;
					value: string;
				}[]
			)
				.filter((m) => m.key && m.value)
				.map((m) => ({ label: m.key, value: m.value }))
		: [];

	const specRows: { label: string; value: string | null | undefined }[] = [
		{ label: 'Material', value: product.material },
		...metaItems,
	].filter((row) => Boolean(row.label));

	return (
		<div className="max-w-3xl">
			{/* Description */}
			<section>
				<h3 className="text-[17px] font-bold text-gray-900 mb-3">
					Product Details
				</h3>
				<div
					className="text-[14.5px] text-gray-600 leading-relaxed product-details"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: markup content
					dangerouslySetInnerHTML={{
						__html: product?.description || '',
					}}
				/>
			</section>

			{/* Specs table */}
			<section className="mt-8">
				<h3 className="text-[17px] font-bold text-gray-900 mb-3">
					More Information
				</h3>
				<div className="rounded-xl border border-black/[0.07] overflow-hidden">
					{specRows.length > 0 ? (
						specRows.map((row, i) => (
							<div
								key={row.label}
								className={`flex text-[14px] ${
									i < specRows.length - 1
										? 'border-b border-black/[0.06]'
										: ''
								}`}
							>
								<span className="w-40 shrink-0 px-4 py-3 bg-[#F7F5FA] font-semibold text-gray-700">
									{row.label}
								</span>
								<span className="flex-1 px-4 py-3 text-gray-600">
									{row.value || 'N/A'}
								</span>
							</div>
						))
					) : (
						<div className="px-4 py-3 text-[14px] text-gray-400">
							No additional information available.
						</div>
					)}
				</div>
			</section>
		</div>
	);
};

export default ProductTabDetails;
