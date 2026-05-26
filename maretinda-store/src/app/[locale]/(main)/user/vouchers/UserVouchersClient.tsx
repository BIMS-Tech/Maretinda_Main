'use client'

import { useState } from 'react'
import Link from 'next/link'
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
								? '⛔ Expired'
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
								Use Now →
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
			{/* Tabs */}
			<div className="flex gap-4 mb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
							activeTab === tab.key
								? 'border-[#432C63] text-[#432C63]'
								: 'border-transparent text-gray-500 hover:text-gray-700'
						}`}
					>
						{tab.label}
						<span
							className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
							style={{
								backgroundColor:
									activeTab === tab.key ? '#432C63' : '#f3f4f6',
								color: activeTab === tab.key ? '#fff' : '#6b7280',
							}}
						>
							{tab.count}
						</span>
					</button>
				))}
			</div>

			{displayed.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-gray-400">
					<div className="text-5xl mb-4">🎟️</div>
					<p className="text-lg font-medium">
						{activeTab === 'active'
							? 'No active vouchers in your wallet'
							: 'No expired vouchers'}
					</p>
					{activeTab === 'active' && (
						<Link
							href="/vouchers"
							className="mt-4 text-sm font-bold px-4 py-2 rounded-lg"
							style={{ backgroundColor: '#432C63', color: '#FFC533' }}
						>
							Browse & Collect Vouchers
						</Link>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{displayed.map((v) => (
						<WalletVoucherCard
							key={v.id}
							voucher={v}
							onRemove={handleRemove}
						/>
					))}
				</div>
			)}
		</div>
	)
}
