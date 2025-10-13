import { Cash, CreditCard } from '@medusajs/icons';
import type React from 'react';

// GiyaPay icon component
const GiyaPayIcon = () => (
	<svg
		fill="none"
		height="20"
		viewBox="0 0 24 24"
		width="20"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M2 4C2 2.89543 2.89543 2 4 2H20C21.1046 2 22 2.89543 22 4V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		/>
		<path
			d="M7 12L10 15L17 8"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		/>
	</svg>
);

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
	string,
	{ title: string; icon: React.JSX.Element }
> = {
	giyapay: {
		icon: <GiyaPayIcon />,
		title: 'GiyaPay',
	},
	'pp_card_stripe-connect': {
		icon: <CreditCard />,
		title: 'Credit card',
	},
	pp_giyapay_giyapay: {
		icon: <GiyaPayIcon />,
		title: 'GiyaPay',
	},
	pp_paypal_paypal: {
		icon: <CreditCard />,
		title: 'PayPal',
	},
	pp_stripe_stripe: {
		icon: <CreditCard />,
		title: 'Credit card',
	},
	'pp_stripe-bancontact_stripe': {
		icon: <CreditCard />,
		title: 'Bancontact',
	},
	'pp_stripe-ideal_stripe': {
		icon: <CreditCard />,
		title: 'iDeal',
	},
	pp_system_default: {
		icon: <Cash />,
		title: 'Cash on Delivery',
	},
	// Add more payment providers here
};

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
	return providerId?.startsWith('pp_card_stripe-connect');
};
export const isPaypal = (providerId?: string) => {
	return providerId?.startsWith('pp_paypal');
};
export const isManual = (providerId?: string) => {
	return providerId?.startsWith('pp_system_default');
};
export const isGiyaPay = (providerId?: string) => {
	return providerId === 'giyapay' || providerId === 'pp_giyapay_giyapay';
};

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
	'krw',
	'jpy',
	'vnd',
	'clp',
	'pyg',
	'xaf',
	'xof',
	'bif',
	'djf',
	'gnf',
	'kmf',
	'mga',
	'rwf',
	'xpf',
	'htg',
	'vuv',
	'xag',
	'xdr',
	'xau',
];
