'use client';

import { ChevronDown } from '@medusajs/icons';
import { DropdownMenu } from '@medusajs/ui';
import type React from 'react';
import { useId, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import type { Language } from '@/types/language';

const LANGUAGE_OPTIONS: Language[] = [
	{ label: 'EN', value: 'en' },
	{ label: 'Filipino', value: 'fil' },
];

const CURRENCY_OPTIONS: Language[] = [
	{ label: 'PHP ₱', value: 'php' },
	{ label: 'USD $', value: 'usd' },
];

const DropdownSelector: React.FC<{
	options: Language[];
	selected: Language;
	onSelect: (option: Language) => void;
	idPrefix: string;
}> = ({ options, selected, onSelect, idPrefix }) => {
	const dropdownId = useId();
	return (
		<DropdownMenu key={`${idPrefix}-${dropdownId}`}>
			<DropdownMenu.Trigger
				suppressHydrationWarning
				className="flex items-center gap-1 text-[12.5px] text-white/85 hover:text-white"
			>
				{selected.label}
				<ChevronDown className="w-2.5 h-2.5" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				align="end"
				className="bg-white shadow-lg px-2 py-1.5 min-w-[100px]"
			>
				{options.map((option) => (
					<DropdownMenu.Item
						className="text-sm hover:!bg-gray-50 text-gray-800"
						key={option.value}
						onClick={() => onSelect(option)}
					>
						{option.label}
					</DropdownMenu.Item>
				))}
			</DropdownMenu.Content>
		</DropdownMenu>
	);
};

const TopHeaderBanner: React.FC = () => {
	const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
	const [selectedCurrency, setSelectedCurrency] = useState(CURRENCY_OPTIONS[0]);

	return (
		<div className="w-full" style={{ backgroundColor: '#372248' }}>
			<div className="max-w-[1360px] mx-auto px-6 h-9 flex items-center justify-between">
				{/* Left: location + utility links */}
				<div className="flex items-center gap-5 text-[12.5px] text-white/85">
					<span className="flex items-center gap-1.5">
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
						Deliver to{' '}
						<span className="text-white font-semibold ml-1">Metro Manila, PH</span>
					</span>
					<span className="hidden md:inline opacity-30 text-white">|</span>
					<a href="#" className="hidden md:inline hover:text-white transition-colors">Track Order</a>
					<a href="#" className="hidden md:inline hover:text-white transition-colors">Help Center</a>
				</div>

				{/* Right: app download, sell on Maretinda, language, currency */}
				<div className="flex items-center gap-5 text-[12.5px] text-white/85">
					<a href="#" className="hidden sm:inline hover:text-white transition-colors">Download App</a>
					<LocalizedClientLink
						href="/vendor"
						className="hidden sm:inline hover:text-white transition-colors"
					>
						Sell on Maretinda
					</LocalizedClientLink>
					<span className="hidden md:inline opacity-30 text-white">|</span>
					<DropdownSelector
						idPrefix="language"
						onSelect={setSelectedLanguage}
						options={LANGUAGE_OPTIONS}
						selected={selectedLanguage}
					/>
					<DropdownSelector
						idPrefix="currency"
						onSelect={setSelectedCurrency}
						options={CURRENCY_OPTIONS}
						selected={selectedCurrency}
					/>
				</div>
			</div>
		</div>
	);
};

export default TopHeaderBanner;
