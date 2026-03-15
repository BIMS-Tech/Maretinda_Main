import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import PaymentWrapper from '@/components/organisms/PaymentContainer/PaymentWrapper';
import { CartAddressSection } from '@/components/sections/CartAddressSection/CartAddressSection';
import CartPaymentSection from '@/components/sections/CartPaymentSection/CartPaymentSection';
import CartReview from '@/components/sections/CartReview/CartReview';
import CartShippingMethodsSection from '@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection';
import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';
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
				<div className="container flex items-center justify-center">
					Loading...
				</div>
			}
		>
			<CheckoutPageContent />
		</Suspense>
	);
}

async function CheckoutPageContent({}) {
	const cart = await retrieveCart();

	if (!cart) {
		return notFound();
	}

	const customer = await retrieveCustomer();

	// Redirect to login if user is not authenticated
	if (!customer) {
		redirect('/login?returnTo=/checkout');
	}

	const shippingMethods = await listCartShippingMethods(cart.id, false);
	const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? '');

	return (
		<PaymentWrapper cart={cart}>
			<main className="container !max-w-7xl mx-auto px-4 !py-12">
				{/* Checkout Title */}
				<h1 className="text-4xl font-bold text-center mb-10" style={{ color: '#111827' }}>
					Checkout
				</h1>

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Left Column - Checkout Steps */}
					<div className="lg:col-span-7 space-y-5">
						{/* Shipping Address Section */}
						<div className="bg-white user-content-wrapper">
							<CartAddressSection
								cart={cart}
								customer={customer}
							/>
						</div>

						{/* Delivery Section */}
						<div className="bg-white user-content-wrapper">
							<CartShippingMethodsSection
								availableShippingMethods={
									shippingMethods as any
								}
								cart={cart}
							/>
						</div>

						{/* Payment Section */}
						<div className="bg-white user-content-wrapper">
							<CartPaymentSection
								availablePaymentMethods={paymentMethods}
								cart={cart}
							/>
						</div>
					</div>

					{/* Right Column - Order Summary */}
					<div className="lg:col-span-5">
						<div className="bg-white h-fit sticky top-4 user-content-wrapper">
							<CartReview cart={cart} />
						</div>
					</div>
				</div>
			</main>
		</PaymentWrapper>
	);
}
