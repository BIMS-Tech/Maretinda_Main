import type { HttpTypes } from '@medusajs/types';
import { Container } from '@medusajs/ui';
import { mapKeys } from 'lodash';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Input } from '@/components/atoms';
import AddressSelect from '@/components/cells/AddressSelect/AddressSelect';
import CountrySelect from '@/components/cells/CountrySelect/CountrySelect';

const ShippingAddress = ({
	customer,
	cart,
	checked,
	onChange,
}: {
	customer: HttpTypes.StoreCustomer | null;
	cart: HttpTypes.StoreCart | null;
	checked: boolean;
	onChange: () => void;
}) => {
	const pathname = usePathname();

	const locale = pathname.split('/')[1];
	const [formData, setFormData] = useState<Record<string, any>>({
		email: cart?.email || '',
		'shipping_address.address_1': cart?.shipping_address?.address_1 || '',
		'shipping_address.city': cart?.shipping_address?.city || '',
		'shipping_address.company': cart?.shipping_address?.company || '',
		'shipping_address.country_code':
			cart?.shipping_address?.country_code || locale,
		'shipping_address.first_name': cart?.shipping_address?.first_name || '',
		'shipping_address.last_name': cart?.shipping_address?.last_name || '',
		'shipping_address.phone': cart?.shipping_address?.phone || '',
		'shipping_address.postal_code':
			cart?.shipping_address?.postal_code || '',
		'shipping_address.province': cart?.shipping_address?.province || '',
	});

	// check if customer has saved addresses that are in the current region
	const addressesInRegion = useMemo(
		() =>
			customer?.addresses.filter(
				(a) => a.country_code && a.country_code === locale,
			),
		[customer?.addresses],
	);

	const setFormAddress = (
		address?: HttpTypes.StoreCartAddress,
		email?: string,
	) => {
		address &&
			setFormData((prevState: Record<string, any>) => ({
				...prevState,
				'shipping_address.address_1': address?.address_1 || '',
				'shipping_address.city': address?.city || '',
				'shipping_address.company': address?.company || '',
				'shipping_address.country_code':
					address?.country_code || locale,
				'shipping_address.first_name': address?.first_name || '',
				'shipping_address.last_name': address?.last_name || '',
				'shipping_address.phone': address?.phone || '',
				'shipping_address.postal_code': address?.postal_code || '',
				'shipping_address.province': address?.province || '',
			}));

		email &&
			setFormData((prevState: Record<string, any>) => ({
				...prevState,
				email: email,
			}));
	};

	useEffect(() => {
		// Ensure cart is not null and has a shipping_address before setting form data
		if (cart && cart.shipping_address) {
			setFormAddress(cart?.shipping_address, cart?.email);
		}

		if (cart && !cart.email && customer?.email) {
			setFormAddress(undefined, customer.email);
		}
	}, [cart]); // Add cart as a dependency

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLInputElement | HTMLSelectElement
		>,
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<>
			{customer && (addressesInRegion?.length || 0) > 0 && (
				<Container className="mb-6 flex flex-col gap-y-4 p-0">
					<p className="text-small-regular">
						{`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
					</p>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
						<AddressSelect
							addresses={addressesInRegion || []}
							addressInput={
								mapKeys(formData, (_, key) =>
									key.replace('shipping_address.', ''),
								) as HttpTypes.StoreCartAddress
							}
							onSelect={setFormAddress}
						/>
					</div>
				</Container>
			)}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Input
					autoComplete="given-name"
					data-testid="shipping-first-name-input"
					label="First name"
					name="shipping_address.first_name"
					onChange={handleChange}
					required
					value={formData['shipping_address.first_name']}
				/>
				<Input
					autoComplete="family-name"
					data-testid="shipping-last-name-input"
					label="Last name"
					name="shipping_address.last_name"
					onChange={handleChange}
					required
					value={formData['shipping_address.last_name']}
				/>
				<Input
					autoComplete="address-line1"
					data-testid="shipping-address-input"
					label="Address"
					name="shipping_address.address_1"
					onChange={handleChange}
					required
					value={formData['shipping_address.address_1']}
				/>
				<Input
					autoComplete="organization"
					data-testid="shipping-company-input"
					label="Company"
					name="shipping_address.company"
					onChange={handleChange}
					value={formData['shipping_address.company']}
				/>
				<Input
					autoComplete="postal-code"
					data-testid="shipping-postal-code-input"
					label="Postal code"
					name="shipping_address.postal_code"
					onChange={handleChange}
					required
					value={formData['shipping_address.postal_code']}
				/>
				<Input
					autoComplete="address-level2"
					data-testid="shipping-city-input"
					label="City"
					name="shipping_address.city"
					onChange={handleChange}
					required
					value={formData['shipping_address.city']}
				/>
				<CountrySelect
					autoComplete="country"
					data-testid="shipping-country-select"
					name="shipping_address.country_code"
					onChange={handleChange}
					region={cart?.region}
					required
					value={formData['shipping_address.country_code']}
				/>
				<Input
					autoComplete="address-level1"
					data-testid="shipping-province-input"
					label="State / Province"
					name="shipping_address.province"
					onChange={handleChange}
					value={formData['shipping_address.province']}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4 my-4">
				<Input
					autoComplete="email"
					data-testid="shipping-email-input"
					label="Email"
					name="email"
					onChange={handleChange}
					required
					title="Enter a valid email address."
					type="email"
					value={formData.email}
				/>
				<Input
					autoComplete="tel"
					data-testid="shipping-phone-input"
					label="Phone"
					name="shipping_address.phone"
					onChange={handleChange}
					value={formData['shipping_address.phone']}
				/>
			</div>
		</>
	);
};

export default ShippingAddress;
