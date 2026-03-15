'use client';

import { ChevronDown } from '@medusajs/icons';
import { DropdownMenu, Text } from '@medusajs/ui';
import type React from 'react';
import { useId, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import type { Language } from '@/types/language';

const LANGUAGE_OPTIONS: Language[] = [
	{ label: 'English', value: 'en' },
	{ label: 'Español', value: 'es' },
	{ label: 'Français', value: 'fr' },
];

const REGION_OPTIONS: Language[] = [
	{ label: 'USA ($)', value: 'us' },
	{ label: 'Europe (€)', value: 'eu' },
	{ label: 'Asia (¥)', value: 'asia' },
];

const TopHeaderBanner: React.FC = () => {
	const [selectedLanguage, setSelectedLanguage] = useState(
		LANGUAGE_OPTIONS[0],
	);
	const [selectedRegion, setSelectedRegion] = useState(REGION_OPTIONS[0]);

	const handleSelect = (
		option: Language,
		setter: React.Dispatch<React.SetStateAction<Language>>,
	) => {
		setter(option);
	};

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
					className="flex justify-center items-center gap-2 text-xs text-ui-fg-on-color hover:text-ui-fg-subtle-on-color"
				>
					{selected.label}
					<ChevronDown />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					align="end"
					className="bg-primary shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)] px-4 py-2"
				>
					{options.map((option) => (
						<DropdownMenu.Item
							className="text-md hover:!bg-ui-bg-subtle-hover"
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

	return (
		<div className="w-full bg-tertiary text-tertiary ">
			<div className="container !max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-0 px-4 lg:px-8 !py-3">
				<div className="flex-1 flex justify-center text-center">
					<Text className="text-tertiary text-md">
						Summer Sale For All Swim Suits And Free Express Delivery
						- OFF 50% |{' '}
						<LocalizedClientLink
							className="ml-2 font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
							href="/shop-now"
						>
							Shop Now
						</LocalizedClientLink>
					</Text>
				</div>

				<div className="flex justify-end items-center gap-4">
					<DropdownSelector
						idPrefix="language"
						onSelect={(opt) =>
							handleSelect(opt, setSelectedLanguage)
						}
						options={LANGUAGE_OPTIONS}
						selected={selectedLanguage}
					/>

					<DropdownSelector
						idPrefix="region"
						onSelect={(opt) => handleSelect(opt, setSelectedRegion)}
						options={REGION_OPTIONS}
						selected={selectedRegion}
					/>
				</div>
			</div>
		</div>
	);
};

export default TopHeaderBanner;
