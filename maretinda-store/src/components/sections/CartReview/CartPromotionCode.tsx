'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';
import dynamic from 'next/dynamic';

import { applyPromotions, deletePromotionCode } from '@/lib/data/cart';
import { toast } from '@/lib/helpers/toast';

const VoucherPicker = dynamic(
	() => import('@/components/sections/VoucherPicker/VoucherPicker'),
	{ ssr: false }
);

export default function CartPromotionCode({
	cart,
}: {
	cart: HttpTypes.StoreCart | null;
}) {
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const appliedCodes =
		cart?.promotions?.map((p: any) => p.code as string) ?? [];

	const handleApply = async (code: string) => {
		if (!code.trim()) return;
		setIsLoading(true);
		try {
			const allCodes = [...new Set([...appliedCodes, code.trim()])];
			const res = await applyPromotions(allCodes);
			if (res) {
				toast.success({ title: `${code} applied` });
			} else {
				toast.error({ title: 'Voucher code not valid or conditions not met' });
			}
		} catch {
			toast.error({ title: 'Failed to apply voucher' });
		} finally {
			setIsLoading(false);
		}
	};

	const handleRemove = async (code: string) => {
		setIsLoading(true);
		try {
			await deletePromotionCode(code);
			toast.success({ title: `${code} removed` });
		} catch {
			toast.error({ title: 'Failed to remove voucher' });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-3">
			{/* Applied vouchers */}
			{appliedCodes.length > 0 && (
				<div className="space-y-1.5">
					{cart?.promotions?.map((promo: any) => (
						<div
							key={promo.id}
							className="flex items-center justify-between px-3 py-2 rounded-lg"
							style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
						>
							<div className="flex items-center gap-2">
								<svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								<code className="text-sm font-mono font-semibold text-green-700">
									{promo.code}
								</code>
								<span className="text-xs text-green-600">applied</span>
							</div>
							<button
								onClick={() => handleRemove(promo.code)}
								disabled={isLoading}
								className="text-xs text-red-400 hover:text-red-600 transition-colors"
							>
								Remove
							</button>
						</div>
					))}
				</div>
			)}

			{/* Voucher selector button */}
			<button
				onClick={() => setIsPickerOpen(true)}
				disabled={isLoading}
				className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed transition-colors hover:border-[#432C63]"
				style={{ borderColor: '#d1d5db', color: '#432C63' }}
			>
				<div className="flex items-center gap-2">
					<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
						<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9Z" />
						<path d="M14 7v10" strokeDasharray="2 2" />
					</svg>
					<span className="text-sm font-semibold">
						{appliedCodes.length > 0
							? `${appliedCodes.length} voucher${appliedCodes.length > 1 ? 's' : ''} applied`
							: 'Select or enter a voucher'}
					</span>
				</div>
				<span className="text-xs font-bold" style={{ color: '#432C63' }}>
					View →
				</span>
			</button>

			{isPickerOpen && (
				<VoucherPicker
					isOpen={isPickerOpen}
					onClose={() => setIsPickerOpen(false)}
					appliedCodes={appliedCodes}
					onApply={handleApply}
					onRemove={handleRemove}
					cartTotal={cart?.subtotal ?? 0}
				/>
			)}
		</div>
	);
}
