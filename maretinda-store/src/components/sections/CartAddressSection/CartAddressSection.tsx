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
					{isAddress && !isOpen && (
						<div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2563eb' }}>
							<CheckCircleSolid className="text-white" width={16} height={16} />
						</div>
					)}
					<h2 className="text-2xl font-bold" style={{ color: '#111827' }}>
						Shipping Address
					</h2>
				</div>
				{isAddress && !isOpen && (
					<button
						type="button"
						onClick={handleEdit}
						className="text-sm font-medium underline"
						style={{ color: '#2563eb' }}
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
							className="mt-6 rounded-lg !font-medium h-12 text-base"
							data-testid="submit-address-button"
							style={{ backgroundColor: '#facc15', color: '#000', fontWeight: 500 }}
						>
							Save
						</Button>
						<ErrorMessage
							data-testid="address-error-message"
							error={message !== 'success' && message}
						/>
					</div>
				) : (
					<div className="pb-2">
						{cart && cart.shipping_address ? (
							<div className="space-y-0.5">
								<p className="font-semibold text-base" style={{ color: '#111827' }}>
									{cart.shipping_address.first_name} {cart.shipping_address.last_name}
								</p>
								<p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
									{cart.shipping_address.address_1}
									{cart.shipping_address.address_2 && `, ${cart.shipping_address.address_2}`}
									, {cart.shipping_address.postal_code} {cart.shipping_address.city}, {cart.shipping_address.country_code?.toUpperCase()}
								</p>
								<p className="text-sm" style={{ color: '#6b7280' }}>
									{cart.email}, {cart.shipping_address.phone}
								</p>
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
