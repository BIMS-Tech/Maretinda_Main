'use client';

import { useTransition } from 'react';

import { notify } from '@/lib/cart-feedback';
import { deleteLineItem } from '@/lib/data/cart';
import { useLanguage } from '@/providers/LanguageProvider';

export const DeleteCartItemButton = ({ id }: { id: string }) => {
	const { t } = useLanguage();
	const [deleting, startDeleting] = useTransition();
	return (
		<button
			aria-label="Remove item"
			className="press flex h-10 w-10 items-center justify-center rounded-full text-[#A39DAC] hover:bg-[#FCEDED] hover:text-[#C43131] disabled:opacity-40"
			disabled={deleting}
			onClick={() =>
				startDeleting(async () => {
					await deleteLineItem(id).catch(() => notify({ title: t.cart.notUpdated, tone: 'error' }));
				})
			}
			type="button"
		>
			{deleting ? (
				<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
			) : (
				<svg aria-hidden="true" fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24" width="17">
					<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
				</svg>
			)}
		</button>
	);
};
