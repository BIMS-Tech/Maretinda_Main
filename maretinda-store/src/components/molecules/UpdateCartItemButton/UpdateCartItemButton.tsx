'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useOptimistic, useTransition } from 'react';

import { EASE_OUT } from '@/components/motion';
import { notify } from '@/lib/cart-feedback';
import { updateLineItem } from '@/lib/data/cart';
import { useLanguage } from '@/providers/LanguageProvider';

/** How many of a cart line. The number changes at once and settles when the shop answers. */
export const UpdateCartItemButton = ({ quantity, lineItemId }: { quantity: number; lineItemId: string }) => {
	const { t } = useLanguage();
	const [shown, show] = useOptimistic(quantity);
	const [saving, startSaving] = useTransition();

	const change = (next: number) =>
		startSaving(async () => {
			show(next);
			try {
				await updateLineItem({ lineId: lineItemId, quantity: next });
			} catch {
				notify({ title: next > quantity ? t.cart.noMoreStock : t.cart.notUpdated, tone: 'error' });
			}
		});

	const step = (label: string, sign: string, next: number, off = false) => (
		<button
			aria-label={label}
			className="press flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-semibold text-[#432C63] hover:bg-[#F6F2FB] disabled:opacity-30"
			disabled={off || saving}
			onClick={() => change(next)}
			type="button"
		>
			{sign}
		</button>
	);

	return (
		<div className="inline-flex items-center rounded-full border border-[#EAE5F0] bg-white">
			{step('Decrease quantity', '−', shown - 1, shown <= 1)}
			<span className="relative flex h-9 w-7 items-center justify-center overflow-hidden text-[14px] font-bold tabular-nums text-[#1B1B1B]">
				<AnimatePresence initial={false} mode="popLayout">
					<m.span animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} initial={{ opacity: 0, y: 14 }} key={shown} transition={{ duration: 0.22, ease: EASE_OUT }}>
						{shown}
					</m.span>
				</AnimatePresence>
			</span>
			{step('Increase quantity', '+', shown + 1)}
		</div>
	);
};
