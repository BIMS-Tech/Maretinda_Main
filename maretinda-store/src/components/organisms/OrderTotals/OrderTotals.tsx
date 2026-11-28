import { account } from '@/lib/account-styles';
import { convertToLocale } from '@/lib/helpers/money';

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
	<div className="flex items-center justify-between py-1.5 text-[15px]">
		<span className="text-black/60">{label}</span>
		<span className={muted ? 'text-[#1F7A4D]' : 'font-medium text-[#1B1B1B]'}>{value}</span>
	</div>
);

/** What the whole order cost: items, delivery, any voucher, and the total. */
export const OrderTotals = ({ orderSet }: { orderSet: any }) => {
	const orders: any[] = orderSet.orders ?? [];
	const subtotal = orders.reduce((acc: number, order: any) => acc + Number(order.item_subtotal ?? 0), 0);
	const delivery = Number(orderSet.shipping_total ?? 0);
	const discount = orders.reduce((acc: number, order: any) => acc + Number(order.discount_total ?? 0), 0);
	const total = subtotal + delivery - discount;
	const currency_code = orderSet.payment_collection?.currency_code ?? orders[0]?.currency_code ?? 'php';
	const money = (amount: number) => convertToLocale({ amount, currency_code });

	return (
		<section className={`${account.card} mt-2 px-5 py-5 sm:px-6`} data-testid="order-totals">
			<p className={`${account.eyebrow} mb-2`}>Summary</p>
			<Row label="Items" value={money(subtotal)} />
			<Row label="Delivery" value={delivery ? money(delivery) : 'Free'} />
			{discount > 0 && <Row label="Voucher" muted value={`−${money(discount)}`} />}
			<div className="mt-3 flex items-center justify-between border-t border-[#EAE5F0] pt-4">
				<span className="text-[15px] font-semibold text-[#1B1B1B]">Total</span>
				<span className="text-[20px] font-semibold text-[#432C63]">{money(total)}</span>
			</div>
		</section>
	);
};
