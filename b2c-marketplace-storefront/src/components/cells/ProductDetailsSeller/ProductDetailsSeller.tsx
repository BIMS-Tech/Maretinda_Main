import { SellerInfo } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
// import { CollapseIcon } from '@/icons';
import type { SellerProps } from '@/types/seller';

export const ProductDetailsSeller = ({ seller }: { seller: SellerProps }) => {
	if (!seller) return null;

	return (
		<div className="bg-[#fafafa] border rounded-sm shadow-sm">
			<div className="p-4">
				<LocalizedClientLink href={`/sellers/${seller.handle}/reviews`}>
					<div className="flex justify-between">
						<SellerInfo seller={seller} />
						{/* <CollapseIcon className="-rotate-90" /> */}
					</div>
				</LocalizedClientLink>
			</div>
		</div>
	);
};
