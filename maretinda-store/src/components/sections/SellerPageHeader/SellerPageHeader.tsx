import type { HttpTypes } from '@medusajs/types';
import { format } from 'date-fns';

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
		<div className="border rounded-sm p-8">
			<SellerHeading header seller={seller} user={user} />
			<p
				className="label-md mt-5 mb-2 text-black"
				dangerouslySetInnerHTML={{
					__html: seller.description,
				}}
			/>
			<p className="label-sm lg:label-md text-secondary mb-5 text-black">
				Joined {format(seller.created_at, 'yyyy-MM-dd')}
			</p>
			<SellerFooter seller={seller} />
		</div>
	);
};
