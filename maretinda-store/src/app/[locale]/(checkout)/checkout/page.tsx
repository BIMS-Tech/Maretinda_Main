import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { MaskedText } from '@/components/motion';
import PaymentWrapper from '@/components/organisms/PaymentContainer/PaymentWrapper';
import { CartAddressSection } from '@/components/sections/CartAddressSection/CartAddressSection';
import CartPaymentSection from '@/components/sections/CartPaymentSection/CartPaymentSection';
import CartReview from '@/components/sections/CartReview/CartReview';
import CartShippingMethodsSection from '@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection';
import { retrieveCart } from '@/lib/data/cart';
import { EmailVerificationNotice } from '@/components/molecules/EmailVerificationNotice/EmailVerificationNotice';
import { retrieveCustomer } from '@/lib/data/customer';
import { getEmailVerification } from '@/lib/data/email-verification';
import { listCartShippingMethods } from '@/lib/data/fulfillment';
import { listCartPaymentMethods } from '@/lib/data/payment';

export const metadata: Metadata = {
	description: 'My cart page - Checkout',
	title: 'Checkout',
};

export default async function CheckoutPage({}) {
	return (
		<Suspense
			fallback={
				<div aria-busy="true" className="container !max-w-7xl mx-auto px-4 !py-12" role="status">
					<span className="sr-only">Loading checkout</span>
					<div className="shimmer mb-8 h-14 w-64 rounded-2xl" />
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
						<div className="space-y-5 lg:col-span-7">
							<div className="shimmer h-72 rounded-[24px]" />
							<div className="shimmer h-24 rounded-[24px]" />
							<div className="shimmer h-24 rounded-[24px]" />
						</div>
						<div className="shimmer h-96 rounded-[24px] lg:col-span-5" />
					</div>
				</div>
			}
		>
			<CheckoutPageContent />
		</Suspense>
	);
}

async function CheckoutPageContent({}) {
	const [cart, customer] = await Promise.all([
		retrieveCart(),
		retrieveCustomer(),
	]);

	// Nothing to check out: their cart says so, and what to do next
	if (!cart?.items?.length) {
		redirect('/cart');
	}

	// Redirect to login if user is not authenticated
	if (!customer) {
		redirect('/login?returnTo=/checkout');
	}

	const [shippingMethods, paymentMethods, verification] = await Promise.all([
		listCartShippingMethods(cart.id, false),
		listCartPaymentMethods(cart.region?.id ?? ''),
		getEmailVerification(),
	]);

	return (
		<PaymentWrapper cart={cart}>
			<main className="container !max-w-7xl mx-auto px-4 !py-12">
				{/* Checkout Title */}
				<h1 className="mb-8 font-serif text-[40px] leading-tight tracking-[-0.01em] text-[#1B1B1B] lg:text-[52px]">
					<MaskedText play text="Checkout" />
				</h1>

				{/* Payment and "Place order" are refused until the email is confirmed */}
				{verification && !verification.verified && (
					<div className="mb-6">
						<EmailVerificationNotice context="checkout" email={verification.email} />
					</div>
				)}

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Left Column - Checkout Steps */}
					<div className="lg:col-span-7 space-y-5">
						{/* Shipping Address Section */}
						<div className="rise-in rounded-[24px] border border-[#EFEAF4] bg-white p-5 sm:p-7" style={{ '--delay': '120ms' } as React.CSSProperties}>
							<CartAddressSection
								cart={cart}
								customer={customer}
							/>
						</div>

						{/* Delivery Section */}
						<div className="rise-in rounded-[24px] border border-[#EFEAF4] bg-white p-5 sm:p-7" style={{ '--delay': '210ms' } as React.CSSProperties}>
							<CartShippingMethodsSection
								availableShippingMethods={
									shippingMethods as any
								}
								cart={cart}
							/>
						</div>

						{/* Payment Section */}
						<div className="rise-in rounded-[24px] border border-[#EFEAF4] bg-white p-5 sm:p-7" style={{ '--delay': '300ms' } as React.CSSProperties}>
							<CartPaymentSection
								availablePaymentMethods={paymentMethods}
								cart={cart}
							/>
						</div>
					</div>

					{/* Right Column - Order Summary */}
					<div className="lg:col-span-5">
						<div className="rise-in sticky top-[132px] h-fit rounded-[24px] border border-[#EFEAF4] bg-white p-5 shadow-[0_24px_60px_-34px_rgba(67,44,99,0.45)] sm:p-7" style={{ '--delay': '260ms' } as React.CSSProperties}>
							<CartReview cart={cart} />
						</div>
					</div>
				</div>
			</main>
		</PaymentWrapper>
	);
}
