import { isEmpty } from 'lodash';

import { AccountEmpty } from '@/components/organisms/Layout/AccountHeading';
import { OrdersPagination } from '@/components/organisms/OrdersPagination/OrdersPagination';
import { SingleOrderReturn } from '@/components/organisms/SingleOrderReturn/SingleOrderReturn';

const LIMIT = 10;

export const OrderReturnRequests = ({
	returns = [],
	user,
	page,
	currentReturn,
}: {
	returns: any[];
	user: any;
	page: string;
	currentReturn: string;
}) => {
	const pages = Math.ceil(returns.length / LIMIT);
	const currentPage = +page || 1;
	const offset = (+currentPage - 1) * LIMIT;

	const processedReturns = returns.slice(offset, offset + LIMIT);

	if (isEmpty(processedReturns)) {
		return (
			<AccountEmpty
				action="See your orders"
				href="/user/orders"
				icon={
					<svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="30">
						<path d="M4 9h11a5 5 0 010 10h-4M4 9l4-4M4 9l4 4" />
					</svg>
				}
				title="No returns"
			>
				You haven't asked to return anything. You can, from an order's page, within 7 days of it being delivered.
			</AccountEmpty>
		);
	}

	return (
		<div>
			{processedReturns.map((item) => (
				<SingleOrderReturn
					defaultOpen={currentReturn === item.id}
					item={item}
					key={item.id}
					user={user}
				/>
			))}
			<div className="mt-8 flex justify-center">
				<OrdersPagination pages={pages} />
			</div>
		</div>
	);
};
