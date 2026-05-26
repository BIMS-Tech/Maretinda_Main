'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { VoucherPromotion } from '@/lib/data/vouchers'
import { collectVoucher } from '@/lib/data/vouchers'
import { toast } from '@/lib/helpers/toast'

type FilterTab = 'all' | 'platform' | 'seller'

function VoucherCard({
	voucher,
	isLoggedIn,
	onCollect,
}: {
	voucher: VoucherPromotion
	isLoggedIn: boolean
	onCollect: (v: VoucherPromotion) => void
}) {
	const isExpired =
		voucher.expires_at && new Date(voucher.expires_at) < new Date()

	const expiryLabel = voucher.expires_at
		? `Valid until ${new Date(voucher.expires_at).toLocaleDateString('en-PH', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
		  })}`
		: 'No expiry'

	return (
		<div
			className={`relative flex rounded-xl overflow-hidden border ${
				isExpired ? 'opacity-60' : ''
			}`}
			style={{ borderColor: '#e5e7eb' }}
		>
			{/* Left color strip */}
			<div
				className="w-2.5 flex-shrink-0"
				style={{
					backgroundColor:
						voucher.scope === 'seller' ? '#432C63' : '#FFC533',
				}}
			/>

			{/* Main content */}
			<div className="flex-1 p-4 bg-white">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						{/* Badge */}
						<span
							className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
							style={{
								backgroundColor:
									voucher.scope === 'seller'
										? '#f3eeff'
										: '#fffbeb',
								color:
									voucher.scope === 'seller'
										? '#432C63'
										: '#92400e',
							}}
						>
							{voucher.scope === 'seller'
								? voucher.seller_name
									? `${voucher.seller_name} Voucher`
									: 'Seller Voucher'
								: 'Platform Voucher'}
						</span>

						{/* Discount */}
						<div
							className="text-2xl font-bold leading-tight"
							style={{ color: '#111827' }}
						>
							{voucher.discount_label}
						</div>

						{/* Min order */}
						{voucher.min_order && (
							<div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
								Min. order ₱{voucher.min_order.toLocaleString()}
							</div>
						)}

						{/* Description */}
						{voucher.description && (
							<div className="text-xs mt-1" style={{ color: '#6b7280' }}>
								{voucher.description}
							</div>
						)}

						{/* Expiry */}
						<div className="text-xs mt-2" style={{ color: '#9ca3af' }}>
							{isExpired ? '⛔ Expired' : expiryLabel}
						</div>
					</div>

					{/* Code + action */}
					<div className="flex flex-col items-end gap-2 flex-shrink-0">
						<code
							className="font-mono text-xs font-bold px-2 py-1 rounded-md tracking-wider"
							style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
						>
							{voucher.code}
						</code>

						{isExpired ? (
							<span className="text-xs text-gray-400">Expired</span>
						) : voucher.is_collected ? (
							<span
								className="text-xs font-semibold px-3 py-1.5 rounded-lg"
								style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
							>
								✓ Collected
							</span>
						) : (
							<button
								className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
								style={{ backgroundColor: '#432C63', color: '#FFC533' }}
								onClick={() => onCollect(voucher)}
								disabled={!isLoggedIn}
								title={!isLoggedIn ? 'Login to collect' : undefined}
							>
								{isLoggedIn ? 'Collect' : 'Login to collect'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Dashed separator notch */}
			<div
				className="w-px self-stretch flex-shrink-0"
				style={{
					borderLeft: '2px dashed #e5e7eb',
					marginLeft: '-1px',
					marginRight: '-1px',
				}}
			/>
		</div>
	)
}

export default function VoucherPageClient({
	vouchers: initialVouchers,
	isLoggedIn,
}: {
	vouchers: VoucherPromotion[]
	isLoggedIn: boolean
}) {
	const [vouchers, setVouchers] = useState(initialVouchers)
	const [activeTab, setActiveTab] = useState<FilterTab>('all')
	const [isPending, startTransition] = useTransition()
	const router = useRouter()

	const filtered = vouchers.filter((v) => {
		if (activeTab === 'all') return true
		return v.scope === activeTab
	})

	const platformCount = vouchers.filter((v) => v.scope === 'platform').length
	const sellerCount = vouchers.filter((v) => v.scope === 'seller').length

	const handleCollect = async (voucher: VoucherPromotion) => {
		if (!isLoggedIn) {
			router.push('/login?returnTo=/vouchers')
			return
		}
		const result = await collectVoucher(voucher.id)
		if (result.success) {
			toast.success({ title: `${voucher.code} added to your wallet!` })
			setVouchers((prev) =>
				prev.map((v) =>
					v.id === voucher.id ? { ...v, is_collected: true } : v
				)
			)
		} else {
			toast.error({ title: result.message || 'Could not collect voucher' })
		}
	}

	const tabs: { key: FilterTab; label: string; count: number }[] = [
		{ key: 'all', label: 'All Vouchers', count: vouchers.length },
		{ key: 'platform', label: 'Platform', count: platformCount },
		{ key: 'seller', label: 'Seller', count: sellerCount },
	]

	return (
		<main className="w-full min-h-[60vh]">
			{/* Hero banner */}
			<div
				className="w-full py-10 lg:py-14"
				style={{ backgroundColor: '#432C63' }}
			>
				<div className="max-w-5xl mx-auto px-4 lg:px-8">
					<div className="flex items-center gap-3 mb-2">
						<span className="text-3xl">🎟️</span>
						<h1
							className="text-3xl font-bold font-lora"
							style={{ color: '#FFC533' }}
						>
							Vouchers
						</h1>
					</div>
					<p className="text-white/80 text-sm">
						Collect vouchers and use them at checkout to save on your orders.
					</p>

					{!isLoggedIn && (
						<div className="mt-4 flex items-center gap-3">
							<Link
								href="/login?returnTo=/vouchers"
								className="text-sm font-bold px-4 py-2 rounded-lg"
								style={{ backgroundColor: '#FFC533', color: '#432C63' }}
							>
								Login to collect vouchers →
							</Link>
						</div>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
				{/* Tabs */}
				<div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
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
							{tab.count > 0 && (
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
							)}
						</button>
					))}
				</div>

				{/* Grid */}
				{filtered.length === 0 ? (
					<div className="text-center py-16 text-gray-400">
						<div className="text-5xl mb-4">🎟️</div>
						<p className="text-lg font-medium">No vouchers available right now</p>
						<p className="text-sm mt-1">Check back soon for new deals!</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{filtered.map((v) => (
							<VoucherCard
								key={v.id}
								voucher={v}
								isLoggedIn={isLoggedIn}
								onCollect={handleCollect}
							/>
						))}
					</div>
				)}

				{/* Go to wallet */}
				{isLoggedIn && (
					<div className="mt-8 text-center">
						<Link
							href="/user/vouchers"
							className="text-sm font-semibold underline underline-offset-4"
							style={{ color: '#432C63' }}
						>
							View my voucher wallet →
						</Link>
					</div>
				)}
			</div>
		</main>
	)
}
