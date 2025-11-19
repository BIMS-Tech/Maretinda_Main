import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CartItems, CartSummary } from '@/components/organisms';
import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';

import CartPromotionCode from '../CartReview/CartPromotionCode';

export const Cart = async () => {
	const cart = await retrieveCart();
	const customer = await retrieveCustomer();

	// Calculate total items count
	const totalItems =
		cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

	return (
		<div className="w-full">
			{/* Shopping Cart Title */}
			<h1 className="text-4xl capitalize text-black font-lora font-bold text-center mb-8">
				Shopping Cart
			</h1>

			{/* Two Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				{/* Left Column - Products */}
				<div className="lg:col-span-8">
					<div className="bg-white user-content-wrapper">
						<CartItems cart={cart} />
					</div>
				</div>

				{/* Right Column - Order Summary */}
				<div className="lg:col-span-4">
					<div className="bg-white !p-6 h-fit sticky top-4 user-content-wrapper">
						<h2
							className="text-xl mb-4"
							style={{ color: '#111827', fontWeight: 700 }}
						>
							Order Summary
						</h2>

						{/* Coupon Code Section */}
						<div className="mb-8">
							<CartPromotionCode cart={cart} />
						</div>

						{/* Cost Breakdown */}
						<CartSummary
							currency_code={cart?.currency_code || ''}
							discount={cart?.discount_total || 0}
							item_total={cart?.item_total || 0}
							shipping_total={cart?.shipping_total || 0}
							tax={cart?.tax_total || 0}
							total={cart?.total || 0}
							totalItems={totalItems}
						/>

						{/* Checkout Button */}
						<div className="mt-6">
							{customer ? (
								<LocalizedClientLink href="/checkout?step=address">
									<Button className="w-full py-2.5 !text-black !font-medium rounded-sm text-md transition-colors">
										Proceed To Checkout
									</Button>
								</LocalizedClientLink>
							) : (
								<LocalizedClientLink
									href={`/user?returnTo=${encodeURIComponent('/checkout?step=address')}`}
								>
									<Button
										className="w-full py-2.5 !text-black !font-medium rounded-sm text-md transition-colors"
										style={{ backgroundColor: '#facc15' }}
									>
										Login to checkout
									</Button>
								</LocalizedClientLink>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
