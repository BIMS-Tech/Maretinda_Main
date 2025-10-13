import { format } from 'date-fns';

import { Divider } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import type { SingleProductSeller } from '@/types/product';

import { SellerAvatar } from '../SellerAvatar/SellerAvatar';

export const CartItemsHeader = ({
	seller,
}: {
	seller: SingleProductSeller;
}) => {
	return (
		<LocalizedClientLink href={`/sellers/${seller.handle}`}>
			<div className="border rounded-sm p-4 flex gap-4 items-center">
				<SellerAvatar
					alt={seller.name}
					photo={seller.photo}
					size={32}
				/>

				<div className="lg:flex gap-2">
					<p className="uppercase heading-xs">{seller.name}</p>
					{seller.id !== 'fleek' && (
						<div className="flex items-center gap-2">
							<Divider square />
							<p className="label-md text-secondary">
								Joined:{' '}
								{format(seller.created_at || '', 'yyyy-MM-dd')}
							</p>
						</div>
					)}
				</div>
			</div>
		</LocalizedClientLink>
	);
};
