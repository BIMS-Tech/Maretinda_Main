import type { HttpTypes } from '@medusajs/types';
import type React from 'react';
import { useState } from 'react';

import { Input } from '@/components/atoms/Input/Input';
import CountrySelect from '@/components/cells/CountrySelect/CountrySelect';

const BillingAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
	const [formData, setFormData] = useState<any>({
		'billing_address.address_1': cart?.billing_address?.address_1 || '',
		'billing_address.city': cart?.billing_address?.city || '',
		'billing_address.company': cart?.billing_address?.company || '',
		'billing_address.country_code':
			cart?.billing_address?.country_code || '',
		'billing_address.first_name': cart?.billing_address?.first_name || '',
		'billing_address.last_name': cart?.billing_address?.last_name || '',
		'billing_address.phone': cart?.billing_address?.phone || '',
		'billing_address.postal_code': cart?.billing_address?.postal_code || '',
		'billing_address.province': cart?.billing_address?.province || '',
	});

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
			<div className="grid grid-cols-2 gap-4">
				<Input
					autoComplete="given-name"
					data-testid="billing-first-name-input"
					label="First name"
					name="billing_address.first_name"
					onChange={handleChange}
					required
					value={formData['billing_address.first_name']}
				/>
				<Input
					autoComplete="family-name"
					data-testid="billing-last-name-input"
					label="Last name"
					name="billing_address.last_name"
					onChange={handleChange}
					required
					value={formData['billing_address.last_name']}
				/>
				<Input
					autoComplete="address-line1"
					data-testid="billing-address-input"
					label="Address"
					name="billing_address.address_1"
					onChange={handleChange}
					required
					value={formData['billing_address.address_1']}
				/>
				<Input
					autoComplete="organization"
					data-testid="billing-company-input"
					label="Company"
					name="billing_address.company"
					onChange={handleChange}
					value={formData['billing_address.company']}
				/>
				<Input
					autoComplete="postal-code"
					data-testid="billing-postal-input"
					label="Postal code"
					name="billing_address.postal_code"
					onChange={handleChange}
					required
					value={formData['billing_address.postal_code']}
				/>
				<Input
					autoComplete="address-level2"
					label="City"
					name="billing_address.city"
					value={formData['billing_address.city']}
				/>
				<CountrySelect
					autoComplete="country"
					data-testid="billing-country-select"
					name="billing_address.country_code"
					onChange={handleChange}
					region={cart?.region}
					required
					value={formData['billing_address.country_code']}
				/>
				<Input
					autoComplete="address-level1"
					data-testid="billing-province-input"
					label="State / Province"
					name="billing_address.province"
					onChange={handleChange}
					value={formData['billing_address.province']}
				/>
				<Input
					autoComplete="tel"
					data-testid="billing-phone-input"
					label="Phone"
					name="billing_address.phone"
					onChange={handleChange}
					value={formData['billing_address.phone']}
				/>
			</div>
		</>
	);
};

export default BillingAddress;
