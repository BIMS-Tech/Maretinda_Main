'use client'

import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useState } from 'react'
import Link from 'next/link'
import { Segmented, SPRING } from '@/components/motion'
import { AccountEmpty } from '@/components/organisms/Layout/AccountHeading'
import type { VoucherPromotion } from '@/lib/data/vouchers'
import { removeVoucher } from '@/lib/data/vouchers'
import { toast } from '@/lib/helpers/toast'

type WalletTab = 'active' | 'used' | 'expired'

function WalletVoucherCard({
	voucher,
	onRemove,
}: {
	voucher: VoucherPromotion
	onRemove: (id: string) => void
}) {
	const isExpired =
		voucher.expires_at && new Date(voucher.expires_at) < new Date()

	return (
		<div
			className={`relative flex rounded-xl overflow-hidden border ${
				isExpired ? 'opacity-50' : ''
			}`}
			style={{ borderColor: '#e5e7eb' }}
		>
			{/* Left strip */}
			<div
				className="w-2.5 flex-shrink-0"
				style={{
					backgroundColor:
						isExpired
							? '#9ca3af'
							: voucher.scope === 'seller'
							? '#432C63'
							: '#FFC533',
				}}
			/>

			<div className="flex-1 p-4 bg-white">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1">
						<span
							className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
							style={{
								backgroundColor:
									voucher.scope === 'seller' ? '#f3eeff' : '#fffbeb',
								color:
									voucher.scope === 'seller' ? '#432C63' : '#92400e',
							}}
						>
							{voucher.scope === 'seller'
								? voucher.seller_name
									? `${voucher.seller_name} Voucher`
									: 'Seller Voucher'
								: 'Platform Voucher'}
						</span>

						<div
							className="text-2xl font-bold"
							style={{ color: '#111827' }}
						>
							{voucher.discount_label}
						</div>

						{voucher.min_order && (
							<div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
								Min. order ₱{voucher.min_order.toLocaleString()}
							</div>
						)}

						<div className="text-xs mt-2" style={{ color: '#9ca3af' }}>
							{isExpired
								? 'Expired'
								: voucher.expires_at
								? `Valid until ${new Date(voucher.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`
								: 'No expiry'}
						</div>
					</div>

					<div className="flex flex-col items-end gap-2">
						<code
							className="font-mono text-xs font-bold px-2 py-1 rounded-md"
							style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
						>
							{voucher.code}
						</code>

						{!isExpired && (
							<Link
								href="/cart"
								className="text-xs font-bold px-3 py-1.5 rounded-lg"
								style={{ backgroundColor: '#432C63', color: '#FFC533' }}
							>
								Use now
							</Link>
						)}

						<button
							className="text-xs text-gray-400 hover:text-red-500 transition-colors"
							onClick={() => onRemove(voucher.id)}
						>
							Remove
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function UserVouchersClient({
	vouchers: initialVouchers,
}: {
	vouchers: VoucherPromotion[]
}) {
	const [vouchers, setVouchers] = useState(initialVouchers)
	const [activeTab, setActiveTab] = useState<WalletTab>('active')

	const now = new Date()
	const activeVouchers = vouchers.filter(
		(v) => !v.expires_at || new Date(v.expires_at) >= now
	)
	const expiredVouchers = vouchers.filter(
		(v) => v.expires_at && new Date(v.expires_at) < now
	)

	const handleRemove = async (promotionId: string) => {
		const result = await removeVoucher(promotionId)
		if (result.success) {
			toast.success({ title: 'Voucher removed from wallet' })
			setVouchers((prev) => prev.filter((v) => v.id !== promotionId))
		} else {
			toast.error({ title: 'Failed to remove voucher' })
		}
	}

	const tabs: { key: WalletTab; label: string; count: number }[] = [
		{ key: 'active', label: 'Active', count: activeVouchers.length },
		{ key: 'expired', label: 'Expired', count: expiredVouchers.length },
	]

	const displayed = activeTab === 'active' ? activeVouchers : expiredVouchers

	return (
		<div>
			<Segmented
				className="mb-6"
				label="Vouchers"
				onChange={setActiveTab}
				options={tabs.map((tab) => ({
					label: (
						<>
							{tab.label} <span className="ml-1 tabular-nums opacity-60">{tab.count}</span>
						</>
					),
					value: tab.key,
				}))}
				tone="light"
				value={activeTab}
			/>

			{displayed.length === 0 ? (
				<AccountEmpty
					action={activeTab === 'active' ? 'Browse vouchers' : undefined}
					href={activeTab === 'active' ? '/vouchers' : undefined}
					icon={
						<svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="30">
							<path d="M3 8.500A1.500 1.500 0 014.500 7h15A1.500 1.500 0 0121 8.500v1.600a2 2 0 000 3.800v1.600a1.500 1.500 0 01-1.500 1.500h-15A1.500 1.500 0 013 15.500v-1.600a2 2 0 000-3.800V8.500zM14 7.500v9" strokeDasharray="0" />
						</svg>
					}
					title={activeTab === 'active' ? 'No vouchers yet' : 'No expired vouchers'}
				>
					{activeTab === 'active' ? 'Collect a voucher and it waits here until you check out.' : 'Vouchers you did not use in time are listed here.'}
				</AccountEmpty>
			) : (
				<ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<AnimatePresence initial={false} mode="popLayout">
						{displayed.map((v) => (
							<m.li animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} initial={{ opacity: 0, scale: 0.94 }} key={v.id} layout transition={SPRING}>
								<WalletVoucherCard onRemove={handleRemove} voucher={v} />
							</m.li>
						))}
					</AnimatePresence>
				</ul>
			)}
		</div>
	)
}
