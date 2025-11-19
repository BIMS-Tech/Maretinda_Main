'use client';

import type { HttpTypes } from '@medusajs/types';
import { useToggleState } from '@medusajs/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { LuCheck } from 'react-icons/lu';

import { Button } from '@/components/atoms';
import ErrorMessage from '@/components/molecules/ErrorMessage/ErrorMessage';
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
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					{isAddress && !isOpen && (
						<div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[#2563EB] text-white overflow-hidden">
							<LuCheck size={15} />
						</div>
					)}
					<h2 className="text-xl text-black !font-bold">
						Shipping Address
					</h2>
				</div>
				{isAddress && !isOpen && (
					<button
						className="text-lg underline underline-offset-2 text-black"
						onClick={handleEdit}
						type="button"
					>
						Edit
					</button>
				)}
			</div>

			<form action={formAction}>
				{isOpen ? (
					<div className="pb-8">
						<ShippingAddress
							cart={cart}
							checked={sameAsBilling}
							customer={customer}
							onChange={toggleSameAsBilling}
						/>

						{/* Save Information Checkbox */}
						<div className="mt-8">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									className="w-4 h-4 rounded border-gray-300"
									defaultChecked
									type="checkbox"
								/>
								<span className="text-md !font-normal text-black">
									Save this information for faster check-out
									next time
								</span>
							</label>
						</div>

						<Button
							className="mt-6 py-2.5 !text-black !font-medium rounded-sm text-md min-w-[112px]"
							data-testid="submit-address-button"
							type="submit"
						>
							Save
						</Button>
						<ErrorMessage
							data-testid="address-error-message"
							error={message !== 'success' && message}
						/>
					</div>
				) : (
					<div className="pb-4">
						{cart && cart.shipping_address ? (
							<div className="space-y-1 font-normal text-lg text-black">
								<p>
									{cart.shipping_address.first_name}{' '}
									{cart.shipping_address.last_name}
								</p>
								<p>
									{cart.shipping_address.address_1}
									{cart.shipping_address.address_2 &&
										`, ${cart.shipping_address.address_2}`}
									, {cart.shipping_address.postal_code}{' '}
									{cart.shipping_address.city},{' '}
									{cart.shipping_address.country_code?.toUpperCase()}
								</p>
								<p>
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
