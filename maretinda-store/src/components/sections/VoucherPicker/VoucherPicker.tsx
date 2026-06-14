'use client'

import { useEffect, useRef, useState } from 'react'
import type { VoucherPromotion } from '@/lib/data/vouchers'
import { getMyVouchers } from '@/lib/data/vouchers'

const BRAND = '#432C63'
const ACCENT = '#FFC533'

interface Props {
	isOpen: boolean
	onClose: () => void
	appliedCodes: string[]
	onApply: (code: string) => void
	onRemove: (code: string) => void
	cartTotal?: number
}

function TicketIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
	return (
		<svg
			className={className}
			style={style}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9Z" />
			<path d="M14 7v10" strokeDasharray="2 2" />
		</svg>
	)
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

	// Lock body scroll while open
	useEffect(() => {
		if (!isOpen) return
		const prev = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = prev
		}
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
			{/* Backdrop — above the site header (z-50) */}
			<div
				ref={overlayRef}
				className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]"
				onClick={onClose}
			/>

			{/* Drawer */}
			<div className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-gray-50 flex flex-col shadow-2xl animate-[slideInRight_0.25s_ease-out]">
				{/* Header */}
				<div
					className="flex items-center justify-between px-5 py-4 text-white"
					style={{ backgroundColor: BRAND }}
				>
					<div className="flex items-center gap-2.5">
						<TicketIcon className="w-5 h-5" style={{ color: ACCENT }} />
						<h2 className="text-base font-bold">Select Voucher</h2>
					</div>
					<button
						onClick={onClose}
						aria-label="Close"
						className="w-8 h-8 -mr-1 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
					>
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
							<path d="M6 6l12 12M18 6L6 18" />
						</svg>
					</button>
				</div>

				{/* Tabs */}
				<div className="flex bg-white border-b border-gray-100">
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
									: 'border-transparent text-gray-400 hover:text-gray-600'
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-4">
					{tab === 'enter' ? (
						<div className="rounded-2xl bg-white p-4 shadow-sm">
							<label className="text-sm font-semibold text-gray-800">
								Have a code?
							</label>
							<p className="text-xs text-gray-400 mt-0.5 mb-3">
								Enter a voucher code to apply it to your order.
							</p>
							<div className="flex gap-2">
								<input
									type="text"
									className="flex-1 h-11 px-3 rounded-xl border border-gray-200 text-sm font-mono uppercase tracking-wide focus:border-[#432C63] focus:ring-1 focus:ring-[#432C63] outline-none transition-colors"
									placeholder="e.g. HELLOMRTD"
									value={manualCode}
									onChange={(e) => setManualCode(e.target.value.toUpperCase())}
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
									className="px-5 h-11 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
									style={{ backgroundColor: BRAND, color: ACCENT }}
								>
									Apply
								</button>
							</div>
						</div>
					) : loading ? (
						<div className="flex flex-col items-center justify-center py-20 gap-3">
							<div
								className="w-8 h-8 rounded-full border-[3px] border-gray-200 animate-spin"
								style={{ borderTopColor: BRAND }}
							/>
							<span className="text-sm text-gray-400">Loading your vouchers…</span>
						</div>
					) : vouchers.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
							<div
								className="w-16 h-16 rounded-2xl flex items-center justify-center"
								style={{ backgroundColor: '#f3eefb' }}
							>
								<TicketIcon className="w-8 h-8" style={{ color: BRAND }} />
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-700">
									No vouchers in your wallet
								</p>
								<p className="text-xs text-gray-400 mt-0.5">
									Collect vouchers to save on your order.
								</p>
							</div>
							<a
								href="/vouchers"
								className="text-sm font-bold px-4 py-2 rounded-full transition-colors"
								style={{ backgroundColor: BRAND, color: ACCENT }}
							>
								Browse vouchers
							</a>
						</div>
					) : (
						<div className="space-y-4">
							{eligibleVouchers.length > 0 && (
								<div className="space-y-3">
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
										Available for this order
									</p>
									{eligibleVouchers.map((v) => (
										<VoucherPickerCard
											key={v.id}
											voucher={v}
											isApplied={appliedCodes.includes(v.code)}
											eligible
											onApply={() => {
												onApply(v.code)
												onClose()
											}}
											onRemove={() => onRemove(v.code)}
										/>
									))}
								</div>
							)}

							{ineligibleVouchers.length > 0 && (
								<div className="space-y-3">
									<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
										Not available for this order
									</p>
									{ineligibleVouchers.map((v) => {
										const reason =
											v.expires_at && new Date(v.expires_at) < new Date()
												? 'Expired'
												: `Min. spend ₱${v.min_order?.toLocaleString()}`
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
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-5 py-4 bg-white border-t border-gray-100">
					<button
						onClick={onClose}
						className="w-full h-11 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
						style={{ backgroundColor: BRAND, color: ACCENT }}
					>
						Done
					</button>
				</div>
			</div>

			<style jsx global>{`
				@keyframes slideInRight {
					from { transform: translateX(100%); }
					to { transform: translateX(0); }
				}
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`}</style>
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
	const stripColor = !eligible
		? '#9ca3af'
		: voucher.scope === 'seller'
		? BRAND
		: ACCENT

	return (
		<div
			className={`relative flex rounded-2xl bg-white shadow-sm border transition-shadow ${
				eligible ? 'hover:shadow-md' : 'opacity-60'
			}`}
			style={{ borderColor: isApplied ? BRAND : '#f0f0f0' }}
		>
			{/* Left accent rail */}
			<div
				className="w-1.5 rounded-l-2xl flex-shrink-0"
				style={{ backgroundColor: stripColor }}
			/>

			{/* Perforation notches */}
			<span className="absolute -top-1.5 left-[3px] w-3 h-3 rounded-full bg-gray-50" />
			<span className="absolute -bottom-1.5 left-[3px] w-3 h-3 rounded-full bg-gray-50" />

			<div className="flex-1 p-4 flex items-center justify-between gap-3 min-w-0">
				<div className="flex-1 min-w-0">
					<div className="text-base font-extrabold leading-tight" style={{ color: BRAND }}>
						{voucher.discount_label}
					</div>
					<div className="mt-1 flex items-center gap-2 flex-wrap">
						<code
							className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded"
							style={{ backgroundColor: '#f3eefb', color: BRAND }}
						>
							{voucher.code}
						</code>
						{voucher.min_order && (
							<span className="text-[11px] text-gray-400">
								Min. ₱{voucher.min_order.toLocaleString()}
							</span>
						)}
					</div>
					{reason && (
						<div className="text-[11px] mt-1.5 font-medium text-red-400">{reason}</div>
					)}
				</div>

				{eligible && (
					<div className="flex-shrink-0">
						{isApplied ? (
							<button
								onClick={onRemove}
								className="text-xs font-bold px-4 py-2 rounded-full border transition-colors hover:bg-gray-50"
								style={{ borderColor: BRAND, color: BRAND }}
							>
								Remove
							</button>
						) : (
							<button
								onClick={onApply}
								className="text-xs font-bold px-4 py-2 rounded-full transition-opacity hover:opacity-90"
								style={{ backgroundColor: BRAND, color: ACCENT }}
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
