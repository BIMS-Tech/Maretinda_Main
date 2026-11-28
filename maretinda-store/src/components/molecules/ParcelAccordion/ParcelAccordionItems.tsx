import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { STATUS_TONE } from '@/lib/account-styles';
import { convertToLocale } from '@/lib/helpers/money';
import { parcelStatuses, steps } from '@/lib/helpers/parcel-statuses';

/** One shop's part of an order: what was bought, from whom, and where it is. */
export const ParcelAccordionItems = ({
	order,
	orderId,
	currency_code,
}: {
	order: any;
	orderId: string;
	currency_code: string;
}) => {
	const status = order.status === 'canceled' ? 'Cancelled' : steps[parcelStatuses(order.fulfillment_status)];
	const items = order?.items ?? [];
	const first = items[0];

	return (
		<li>
			<LocalizedClientLink
				className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FAF8F5] sm:px-6"
				href={`/user/orders/${orderId}`}
			>
				<span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[#EAE5F0] bg-[#FAF8F5]">
					{first?.thumbnail ? (
						<Image alt="" className="object-cover" fill sizes="56px" src={first.thumbnail} />
					) : (
						<Image alt="" className="scale-50 opacity-25" fill src="/images/placeholder.svg" />
					)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-[15px] font-medium text-[#1B1B1B]">
						{first?.product_title ?? first?.title ?? 'Item'}
						{items.length > 1 && <span className="font-normal text-black/50"> and {items.length - 1} more</span>}
					</span>
					{order.seller?.name && <span className="block truncate text-[13px] text-black/55">from {order.seller.name}</span>}
				</span>
				<span className="hidden text-[14px] font-medium text-[#1B1B1B] sm:block">
					{convertToLocale({ amount: order.total ?? 0, currency_code })}
				</span>
				<span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${STATUS_TONE[status] ?? STATUS_TONE.Received}`}>
					{status}
				</span>
			</LocalizedClientLink>
		</li>
	);
};
