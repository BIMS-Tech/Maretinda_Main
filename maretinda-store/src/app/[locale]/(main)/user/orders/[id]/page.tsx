import { format } from 'date-fns';
import { redirect } from 'next/navigation';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { Layout } from '@/components/organisms';
import { OrderDetailsSection } from '@/components/sections/OrderDetailsSection/OrderDetailsSection';
import { ArrowLeftIcon } from '@/icons';
import { retrieveCustomer } from '@/lib/data/customer';
import { retrieveOrderSet } from '@/lib/data/orders';

export default async function UserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	const orderSet = await retrieveOrderSet(id);

	// const orderSet2 = {
	// 	billing_address: {
	// 		address_1: '123 Main St',
	// 		city: 'Anytown',
	// 		country_code: 'US',
	// 		first_name: 'Jane',
	// 		last_name: 'Doe',
	// 	},
	// 	created_at: '2025-11-08T10:00:00.000Z',
	// 	display_id: 12345,
	// 	id: 'os_01HTP0V88X7M601J2V00V9Q3B8',
	// 	orders: [
	// 		{
	// 			currency_code: 'USD',
	// 			fulfillment_status: 'shipped',
	// 			id: 'ord_01HTP0V88X7M601J2V00V9Q3B9',
	// 			item_subtotal: 8500,
	// 			items: [
	// 				{
	// 					id: 'oi_01G827K6Q1B5M8S8N01Q2W4T6Y',
	// 					product_title: 'Wireless Mechanical Keyboard',
	// 					quantity: 1,
	// 					thumbnail: '/images/featured-products/sneakers.png',
	// 					title: 'Wireless Mechanical Keyboard',
	// 					unit_price: 8500,
	// 					variant: {
	// 						product: {
	// 							handle: 'wireless-mechanical-keyboard',
	// 							title: 'Wireless Keyboard',
	// 						},
	// 						title: 'Red Switches, Full Size',
	// 					},
	// 					variant_title: 'Red Switches, Full Size',
	// 				},
	// 			],
	// 			payment_status: 'paid',
	// 			seller: {
	// 				id: 'sell_01G827K6Q1B5M8S8N01Q2W4T6X',
	// 				name: 'Tech Gadgets Co.',
	// 				photo: '/images/featured-products/toy.png',
	// 			},
	// 			status: 'shipped',
	// 			total: 8500,
	// 		},
	// 		{
	// 			currency_code: 'USD',
	// 			fulfillment_status: 'not_fulfilled',
	// 			id: 'ord_01HTP0V88X7M601J2V00V9Q3C0',
	// 			item_subtotal: 11500,
	// 			items: [
	// 				{
	// 					id: 'oi_01G827K6Q1B5M8S8N01Q2W4T7B',
	// 					product_title: 'Summer Linen Dress',
	// 					quantity: 2,
	// 					thumbnail: '/images/featured-products/sneakers.png',
	// 					title: 'Summer Linen Dress',
	// 					unit_price: 4500,
	// 					variant: {
	// 						product: {
	// 							handle: 'summer-linen-dress',
	// 							title: 'Linen Dress',
	// 						},
	// 						title: 'Size M, Blue',
	// 					},
	// 					variant_title: 'Size M, Blue',
	// 				},
	// 				{
	// 					id: 'oi_01G827K6Q1B5M8S8N01Q2W4T7C',
	// 					product_title: 'Classic Leather Belt',
	// 					quantity: 1,
	// 					thumbnail: '/images/featured-products/sneakers.png',
	// 					title: 'Leather Belt',
	// 					unit_price: 2500,
	// 					variant: {
	// 						product: {
	// 							handle: 'classic-leather-belt',
	// 							title: 'Leather Belt',
	// 						},
	// 						title: 'Brown, Size 34',
	// 					},
	// 					variant_title: 'Brown, Size 34',
	// 				},
	// 			],
	// 			payment_status: 'paid',
	// 			seller: {
	// 				id: 'sell_01G827K6Q1B5M8S8N01Q2W4T7A',
	// 				name: 'Fashion Finds Store',
	// 				photo: '/images/featured-products/toy.png',
	// 			},
	// 			status: 'processing',
	// 			total: 11500,
	// 		},
	// 	],
	// 	payment_collection: {
	// 		currency_code: 'USD',
	// 	},
	// 	shipping_address: {
	// 		address_1: '123 Main St',
	// 		city: 'Anytown',
	// 		country_code: 'US',
	// 		first_name: 'Jane',
	// 		last_name: 'Doe',
	// 	},
	// 	shipping_total: 500,
	// 	total: 20000,
	// };

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<LocalizedClientLink href="/user/orders">
					<Button className="text-[13px] capitalize !font-medium flex items-center gap-2 py-2.5">
						<ArrowLeftIcon className="size-4" />
						All orders
					</Button>
				</LocalizedClientLink>
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between my-8 gap-2">
					<h1 className="heading-md !font-bold text-black uppercase font-lora">
						Order #{orderSet.display_id}
					</h1>
					<p className="label-lg !font-normal text-primary">
						Order date:{' '}
						<span className="!font-bold">
							{format(orderSet.created_at || '', 'yyyy-MM-dd')}
						</span>
					</p>
				</div>
				<OrderDetailsSection orderSet={orderSet} />
			</div>
		</Layout>
	);
}
