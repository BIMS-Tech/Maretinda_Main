'use client';

import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CloseIcon, CollapseIcon, HamburgerMenuIcon } from '@/icons';
import { NavText } from '@/i18n/NavText';
import { sortCategories } from '@/lib/utils';

type Category = HttpTypes.StoreProductCategory;

const SELLER_PANEL_URL = process.env.NEXT_PUBLIC_seller_PANEL_URL || '';
const SELLER_REGISTER_URL = SELLER_PANEL_URL ? `${SELLER_PANEL_URL}/register` : '#';

const MobileCategoryItem = ({
	category,
	onNavigate,
}: {
	category: Category;
	onNavigate: () => void;
}) => {
	const [open, setOpen] = useState(false);
	const subcategories = (category.category_children ?? []).slice().sort(sortCategories);
	const hasSubs = subcategories.length > 0;

	return (
		<div className="border-b border-black/[0.06]">
			<div className="flex items-center">
				<LocalizedClientLink
					href={`/categories/${category.handle}`}
					onClick={onNavigate}
					className="flex-1 px-5 py-3.5 text-[15px] font-semibold text-[#1B1B1B] active:text-[#432C63] transition-colors"
				>
					{category.name}
				</LocalizedClientLink>
				{hasSubs && (
					<button
						type="button"
						aria-label={open ? 'Collapse' : 'Expand'}
						aria-expanded={open}
						onClick={() => setOpen((v) => !v)}
						className="px-4 self-stretch flex items-center text-[#9A8FB0] hover:text-[#432C63] transition-colors"
					>
						<CollapseIcon
							size={18}
							className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
						/>
					</button>
				)}
			</div>

			{hasSubs && (
				<div
					className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? 'max-h-[600px]' : 'max-h-0'}`}
					style={{ backgroundColor: '#FAF8F5' }}
				>
					<div className="py-1">
						{subcategories.map((sub) => (
							<LocalizedClientLink
								key={sub.id}
								href={`/categories/${category.handle}/${sub.handle}`}
								onClick={onNavigate}
								className="flex items-center gap-2 pl-8 pr-5 py-2.5 text-[14px] text-[#404040] hover:text-[#432C63] transition-colors"
							>
								<span className="w-1 h-1 rounded-full bg-[#C9BEDB]" />
								{sub.name}
							</LocalizedClientLink>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export const MobileNavbar = ({
	childrenCategories,
}: {
	childrenCategories: Category[];
	parentCategories: Category[];
}) => {
	const [openMenu, setOpenMenu] = useState(false);

	const close = () => setOpenMenu(false);

	// Lock body scroll while the drawer is open
	useEffect(() => {
		if (openMenu) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [openMenu]);

	const categories = (childrenCategories ?? []).slice().sort(sortCategories);

	return (
		<div className="md:hidden">
			<button
				type="button"
				aria-label="Open menu"
				onClick={() => setOpenMenu(true)}
				className="flex items-center"
			>
				<HamburgerMenuIcon color="white" />
			</button>

			{/* Drawer */}
			<div
				className={`fixed inset-0 z-50 ${openMenu ? '' : 'pointer-events-none'}`}
				aria-hidden={!openMenu}
			>
				{/* Backdrop */}
				{/** biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
				<div
					className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${openMenu ? 'opacity-100' : 'opacity-0'}`}
					onClick={close}
				/>

				{/* Panel */}
				<div
					className={`absolute inset-y-0 left-0 w-[86%] max-w-[360px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${openMenu ? 'translate-x-0' : '-translate-x-full'}`}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-5 h-16 shrink-0" style={{ backgroundColor: '#432C63' }}>
						<LocalizedClientLink href="/" onClick={close} className="flex items-center">
							<Image src="/logo-m-2.png" alt="Maretinda" width={130} height={42} className="object-contain" priority />
						</LocalizedClientLink>
						<button
							type="button"
							aria-label="Close menu"
							onClick={close}
							className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
						>
							<CloseIcon size={22} color="white" />
						</button>
					</div>

					{/* Category list */}
					<div className="flex-1 overflow-y-auto overscroll-contain">
						<div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A8FB0]">
							<NavText k="allCategories" />
						</div>
						{categories.map((category) => (
							<MobileCategoryItem key={category.id} category={category} onNavigate={close} />
						))}
					</div>

					{/* Quick links footer */}
					<div className="shrink-0 border-t border-black/[0.06] p-4 space-y-2">
						<LocalizedClientLink
							href="/flash-sale"
							onClick={close}
							className="flex items-center gap-2 px-3 h-11 rounded-xl font-bold text-[14px]"
							style={{ backgroundColor: 'rgba(255,197,51,0.16)', color: '#7A5A00' }}
						>
							<span className="relative flex w-2 h-2">
								<span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: '#FFC533' }} />
								<span className="relative inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#FFC533' }} />
							</span>
							<NavText k="flashSale" />
						</LocalizedClientLink>
						<a
							href={SELLER_REGISTER_URL}
							onClick={close}
							className="flex items-center justify-center px-3 h-11 rounded-xl font-bold text-[14px] text-white"
							style={{ backgroundColor: '#432C63' }}
						>
							<NavText k="sellNow" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};
