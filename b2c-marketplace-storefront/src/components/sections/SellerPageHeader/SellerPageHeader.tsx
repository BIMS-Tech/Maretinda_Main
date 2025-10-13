import type { HttpTypes } from '@medusajs/types';

import { SellerFooter, SellerHeading } from '@/components/organisms';

export const SellerPageHeader = ({
	header = false,
	seller,
	user,
}: {
	header?: boolean;
	seller: any;
	user: HttpTypes.StoreCustomer | null;
}) => {
	return (
		<div className="border rounded-sm p-4">
			<SellerHeading header seller={seller} user={user} />
			<p
				className="label-md my-5"
				dangerouslySetInnerHTML={{
					__html: seller.description,
				}}
			/>
			<SellerFooter seller={seller} />
		</div>
	);
};
