import { SellerInfo } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
// import { CollapseIcon } from '@/icons';
import type { SellerProps } from '@/types/seller';

export const ProductDetailsSeller = ({ seller }: { seller?: SellerProps }) => {
	// if (!seller) return null;

	return (
		<div className="bg-[#fafafa] border rounded-sm shadow-sm">
			<div className="p-4">
				{/* <LocalizedClientLink href={`/sellers/${seller.handle}`}> */}
				<LocalizedClientLink href="/sellers">
					<div className="flex justify-between">
						{/* <SellerInfo seller={seller} /> */}
						<SellerInfo
							seller={{
								created_at: '2023-01-15T10:00:00Z',
								description:
									'Curated selection of authentic vintage t-shirts from the 80s and 90s.',
								email: 'contact@vintagetees.com',
								handle: 'vintage-tees',
								id: 'slr_abc123xyz789',
								name: 'The Vintage Tee Shop',
								photo: '',
								products: [],
								reviews: [],
								store_status: 'ACTIVE',
								tax_id: 'VAT-9876543210',
							}}
						/>
						{/* <CollapseIcon className="-rotate-90" /> */}
					</div>
				</LocalizedClientLink>
			</div>
		</div>
	);
};
