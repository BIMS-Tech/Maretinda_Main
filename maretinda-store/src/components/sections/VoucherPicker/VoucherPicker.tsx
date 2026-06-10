'use client'

import { useEffect, useRef, useState } from 'react'
import type { VoucherPromotion } from '@/lib/data/vouchers'
import { getMyVouchers } from '@/lib/data/vouchers'

interface Props {
	isOpen: boolean
	onClose: () => void
	appliedCodes: string[]
	onApply: (code: string) => void
	onRemove: (code: string) => void
	cartTotal?: number
}

export default function VoucherPicker({
	isOpen,
	onClose,
	appliedCodes,
	onApply,
	onRemove,
	cartTotal = 0,
}: Props) {
	const [vouchers, setVouchers] = useState<VoucherPromotion[]>([])
	const [loading, setLoading] = useState(false)
	const [tab, setTab] = useState<'collected' | 'enter'>('collected')
	const [manualCode, setManualCode] = useState('')
	const overlayRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isOpen) return
		setLoading(true)
		getMyVouchers()
			.then((v) => setVouchers(v))
			.finally(() => setLoading(false))
	}, [isOpen])

	if (!isOpen) return null

	const eligibleVouchers = vouchers.filter((v) => {
		if (v.expires_at && new Date(v.expires_at) < new Date()) return false
		if (v.min_order && cartTotal < v.min_order * 100) return false
		return true
	})

	const ineligibleVouchers = vouchers.filter((v) => {
		if (v.expires_at && new Date(v.expires_at) < new Date()) return true
		if (v.min_order && cartTotal < v.min_order * 100) return true
		return false
	})

	return (
		<>
			{/* Backdrop */}
			<div
				ref={overlayRef}
				className="fixed inset-0 z-50 bg-black/40"
				onClick={onClose}
			/>

			{/* Drawer (Shopee-style bottom sheet on mobile, right panel on desktop) */}
			<div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white flex flex-col shadow-2xl">
				{/* Header */}
				<div
					className="flex items-center justify-between px-5 py-4 border-b"
					style={{ borderColor: '#e5e7eb' }}
				>
					<h2 className="text-lg font-bold" style={{ color: '#111827' }}>
						Select Voucher
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
					>
						×
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b" style={{ borderColor: '#e5e7eb' }}>
					{[
						{ key: 'collected', label: 'My Vouchers' },
						{ key: 'enter', label: 'Enter Code' },
					].map((t) => (
						<button
							key={t.key}
							onClick={() => setTab(t.key as any)}
							className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
								tab === t.key
									? 'border-[#432C63] text-[#432C63]'
									: 'border-transparent text-gray-500'
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-4">
					{tab === 'enter' ? (
						<div className="space-y-3">
							<p className="text-sm text-gray-500">
								Enter a voucher code to apply it to your order.
							</p>
							<div className="flex gap-2">
								<input
									type="text"
									className="flex-1 h-10 px-3 rounded-lg border text-sm font-mono uppercase"
									style={{ borderColor: '#d1d5db' }}
									placeholder="e.g. HELLOMRTD"
									value={manualCode}
									onChange={(e) =>
										setManualCode(e.target.value.toUpperCase())
									}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && manualCode.trim()) {
											onApply(manualCode.trim())
											setManualCode('')
											onClose()
										}
									}}
								/>
								<button
									disabled={!manualCode.trim()}
									onClick={() => {
										if (manualCode.trim()) {
											onApply(manualCode.trim())
											setManualCode('')
											onClose()
										}
									}}
									className="px-4 h-10 rounded-lg text-sm font-bold disabled:opacity-50"
									style={{ backgroundColor: '#432C63', color: '#FFC533' }}
								>
									Apply
								</button>
							</div>
						</div>
					) : loading ? (
						<div className="flex items-center justify-center py-16 text-gray-400">
							<span className="text-sm">Loading your vouchers…</span>
						</div>
					) : vouchers.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
							<span className="text-4xl">🎟️</span>
							<p className="text-sm font-medium">No vouchers in your wallet</p>
							<a
								href="/vouchers"
								className="text-sm font-bold underline underline-offset-4"
								style={{ color: '#432C63' }}
							>
								Browse & collect vouchers
							</a>
						</div>
					) : (
						<div className="space-y-3">
							{eligibleVouchers.length > 0 && (
								<>
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
										Available for this order
									</p>
									{eligibleVouchers.map((v) => {
										const isApplied = appliedCodes.includes(v.code)
										return (
											<VoucherPickerCard
												key={v.id}
												voucher={v}
												isApplied={isApplied}
												eligible
												onApply={() => {
													onApply(v.code)
													onClose()
												}}
												onRemove={() => onRemove(v.code)}
											/>
										)
									})}
								</>
							)}

							{ineligibleVouchers.length > 0 && (
								<>
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
										Not available for this order
									</p>
									{ineligibleVouchers.map((v) => {
										const reason =
											v.expires_at &&
											new Date(v.expires_at) < new Date()
												? 'Expired'
												: `Min. order ₱${v.min_order?.toLocaleString()}`
										return (
											<VoucherPickerCard
												key={v.id}
												voucher={v}
												isApplied={false}
												eligible={false}
												reason={reason}
												onApply={() => {}}
												onRemove={() => {}}
											/>
										)
									})}
								</>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					className="px-5 py-4 border-t"
					style={{ borderColor: '#e5e7eb' }}
				>
					<button
						onClick={onClose}
						className="w-full h-11 rounded-lg text-sm font-bold"
						style={{ backgroundColor: '#432C63', color: '#FFC533' }}
					>
						Done
					</button>
				</div>
			</div>
		</>
	)
}

function VoucherPickerCard({
	voucher,
	isApplied,
	eligible,
	reason,
	onApply,
	onRemove,
}: {
	voucher: VoucherPromotion
	isApplied: boolean
	eligible: boolean
	reason?: string
	onApply: () => void
	onRemove: () => void
}) {
	return (
		<div
			className={`flex rounded-xl overflow-hidden border ${
				!eligible ? 'opacity-50' : ''
			}`}
			style={{ borderColor: isApplied ? '#432C63' : '#e5e7eb' }}
		>
			<div
				className="w-2 flex-shrink-0"
				style={{
					backgroundColor: !eligible
						? '#9ca3af'
						: voucher.scope === 'seller'
						? '#432C63'
						: '#FFC533',
				}}
			/>
			<div className="flex-1 p-3 flex items-center justify-between gap-3 bg-white">
				<div className="flex-1 min-w-0">
					<div className="text-sm font-bold" style={{ color: '#111827' }}>
						{voucher.discount_label}
					</div>
					{voucher.min_order && (
						<div className="text-xs" style={{ color: '#6b7280' }}>
							Min. ₱{voucher.min_order.toLocaleString()}
						</div>
					)}
					<code
						className="text-xs font-mono font-bold"
						style={{ color: '#6b7280' }}
					>
						{voucher.code}
					</code>
					{reason && (
						<div className="text-xs mt-0.5 text-red-400">{reason}</div>
					)}
				</div>

				{eligible && (
					<div>
						{isApplied ? (
							<button
								onClick={onRemove}
								className="text-xs font-bold px-3 py-1.5 rounded-lg border"
								style={{ borderColor: '#432C63', color: '#432C63' }}
							>
								Remove
							</button>
						) : (
							<button
								onClick={onApply}
								className="text-xs font-bold px-3 py-1.5 rounded-lg"
								style={{ backgroundColor: '#432C63', color: '#FFC533' }}
							>
								Apply
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
