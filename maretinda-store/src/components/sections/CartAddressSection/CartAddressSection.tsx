'use client';

import { CheckCircleSolid } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { Heading, Text, useToggleState } from '@medusajs/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect } from 'react';

import { Button } from '@/components/atoms';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import ShippingAddress from '@/components/organisms/ShippingAddress/ShippingAddress';
import Spinner from '@/icons/spinner';
import { setAddresses } from '@/lib/data/cart';
import compareAddresses from '@/lib/helpers/compare-addresses';

export const CartAddressSection = ({
	cart,
	customer,
}: {
	cart: HttpTypes.StoreCart | null;
	customer: HttpTypes.StoreCustomer | null;
}) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const isAddress = Boolean(
		cart?.shipping_address &&
			cart?.shipping_address.first_name &&
			cart?.shipping_address.last_name &&
			cart?.shipping_address.address_1 &&
			cart?.shipping_address.city &&
			cart?.shipping_address.postal_code &&
			cart?.shipping_address.country_code,
	);
	const isOpen = searchParams.get('step') === 'address' || !isAddress;

	const { state: sameAsBilling, toggle: toggleSameAsBilling } =
		useToggleState(
			cart?.shipping_address && cart?.billing_address
				? compareAddresses(
						cart?.shipping_address,
						cart?.billing_address,
					)
				: true,
		);

	const [message, formAction] = useActionState(setAddresses, '');

	useEffect(() => {
		if (!isAddress && !isOpen) {
			router.replace(pathname + '?step=address');
		}
	}, [isAddress, isOpen, pathname, router]);

	// Handle successful form submission
	useEffect(() => {
		if (message === 'success') {
			router.replace(`${pathname}?step=delivery`);
			router.refresh();
		}
	}, [message, pathname, router]);

	const handleEdit = () => {
		router.replace(pathname + '?step=address');
	};

	return (
		<div>
			{/* Header with Checkmark and Edit */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					{isAddress && !isOpen ? (
						<div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#432C63' }}>
							<CheckCircleSolid className="text-white" width={16} height={16} />
						</div>
					) : (
						<div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(67,44,99,0.08)', color: '#432C63' }}>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
							</svg>
						</div>
					)}
					<h2 className="text-xl font-bold" style={{ color: '#111827' }}>
						Shipping Address
					</h2>
				</div>
				{isAddress && !isOpen && (
					<button
						type="button"
						onClick={handleEdit}
						className="text-sm font-semibold hover:opacity-80 transition-opacity"
						style={{ color: '#432C63' }}
					>
						Edit
					</button>
				)}
			</div>
			
			<form
				action={formAction}
			>
				{isOpen ? (
					<div className="pb-8">
						<ShippingAddress
							cart={cart}
							checked={sameAsBilling}
							customer={customer}
							onChange={toggleSameAsBilling}
						/>
						
						{/* Save Information Checkbox */}
						<div className="mt-4 mb-6">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									className="w-4 h-4 rounded border-gray-300"
									defaultChecked
								/>
								<span className="text-sm" style={{ color: '#374151' }}>
									Save this information for faster check-out next time
								</span>
							</label>
						</div>

						<Button
							type="submit"
							className="mt-5 rounded-lg !font-semibold h-10 text-sm px-8 w-full sm:w-auto"
							data-testid="submit-address-button"
							style={{ backgroundColor: '#facc15', color: '#000', fontWeight: 600 }}
						>
							Save & continue
						</Button>
						<ErrorMessage
							data-testid="address-error-message"
							error={message !== 'success' && message}
						/>
					</div>
				) : (
					<div className="pb-2">
						{cart && cart.shipping_address ? (
							<div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-1.5">
								<p className="font-semibold text-[15px]" style={{ color: '#111827' }}>
									{cart.shipping_address.first_name} {cart.shipping_address.last_name}
								</p>
								<p className="text-[13px] leading-relaxed" style={{ color: '#6b7280' }}>
									{cart.shipping_address.address_1}
									{cart.shipping_address.address_2 && `, ${cart.shipping_address.address_2}`}
									, {cart.shipping_address.postal_code} {cart.shipping_address.city}, {cart.shipping_address.country_code?.toUpperCase()}
								</p>
								<div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[13px]" style={{ color: '#6b7280' }}>
									<span className="inline-flex items-center gap-1.5">
										<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" opacity="0" /><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
										{cart.email}
									</span>
									{cart.shipping_address.phone && (
										<span className="inline-flex items-center gap-1.5">
											<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
											{cart.shipping_address.phone}
										</span>
									)}
								</div>
							</div>
						) : (
							<div>
								<Spinner />
							</div>
						)}
					</div>
				)}
			</form>
		</div>
	);
};
