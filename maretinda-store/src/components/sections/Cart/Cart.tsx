import { MaskedText } from '@/components/motion';
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
			<h1 className="mb-8 font-serif text-[38px] leading-tight tracking-[-0.01em] text-[#1B1B1B] lg:text-[50px]">
				<MaskedText play text="Shopping Cart" />
			</h1>

			{/* Two Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				{/* Left Column - Products */}
				<div className="lg:col-span-8">
					<div className="rise-in rounded-[24px] border border-[#EFEAF4] bg-white p-5 sm:p-7">
						<CartItems cart={cart} />
					</div>
				</div>

				{/* Right Column - Order Summary */}
				<div className="lg:col-span-4">
					<div className="rise-in sticky top-[132px] h-fit rounded-[24px] border border-[#EFEAF4] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(67,44,99,0.4)]" style={{ '--delay': '120ms' } as React.CSSProperties}>
						<h2 className="mb-4 text-[19px] font-extrabold text-[#1B1B1B]">Order Summary</h2>
						{/* Coupon Code Section: nothing to discount in an empty cart */}
						{totalItems > 0 && (
							<div className="mb-8">
								<CartPromotionCode cart={cart} />
							</div>
						)}

						{/* Cost Breakdown */}
						<CartSummary
							// The store sells in pesos; an empty cart has no currency yet
							currency_code={cart?.currency_code || 'php'}
							discount={cart?.discount_total || 0}
							item_subtotal={cart?.item_subtotal || 0}
							shipping_total={cart?.shipping_total || 0}
					has_shipping_method={(cart?.shipping_methods?.length ?? 0) > 0}
							tax={cart?.tax_total || 0}
							total={cart?.total || 0}
							totalItems={totalItems}
						/>

						{/* Checkout Button */}
						{totalItems > 0 && (
						<div className="mt-6">
							{customer ? (
								<LocalizedClientLink href="/checkout?step=address">
									<span className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#FFC533] text-[14.5px] font-bold text-[#432C63]">
										Proceed To Checkout
										<svg aria-hidden="true" className="arrow" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="16"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
									</span>
								</LocalizedClientLink>
							) : (
								<LocalizedClientLink
									href={`/user?returnTo=${encodeURIComponent('/checkout?step=address')}`}
								>
									<span className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#FFC533] text-[14.5px] font-bold text-[#432C63]">
										Login to checkout
										<svg aria-hidden="true" className="arrow" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="16"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
									</span>
								</LocalizedClientLink>
							)}
						</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
