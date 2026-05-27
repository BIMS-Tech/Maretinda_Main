'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { VoucherPromotion } from '@/lib/data/vouchers'
import { collectVoucher } from '@/lib/data/vouchers'
import { toast } from '@/lib/helpers/toast'

interface Props {
	vouchers: VoucherPromotion[]
	isLoggedIn: boolean
	sellerName: string
}

export default function SellerVouchers({ vouchers, isLoggedIn, sellerName }: Props) {
	const [list, setList] = useState(vouchers)

	if (list.length === 0) return null

	const handleCollect = async (voucher: VoucherPromotion) => {
		if (!isLoggedIn) {
			window.location.href = `/login?returnTo=${window.location.pathname}`
			return
		}
		const result = await collectVoucher(voucher.id)
		if (result.success) {
			toast.success({ title: `${voucher.code} added to your wallet!` })
			setList((prev) =>
				prev.map((v) => (v.id === voucher.id ? { ...v, is_collected: true } : v))
			)
		} else {
			toast.error({ title: result.message || 'Could not collect voucher' })
		}
	}

	return (
		<div className="py-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<span className="text-sm">🎟️</span>
					<span className="text-sm font-semibold" style={{ color: '#111827' }}>
						{sellerName} Vouchers
					</span>
					<span
						className="text-xs px-2 py-0.5 rounded-full font-medium"
						style={{ backgroundColor: '#f3eeff', color: '#432C63' }}
					>
						{list.length}
					</span>
				</div>
				<Link
					href="/vouchers?tab=seller"
					className="text-xs underline underline-offset-4"
					style={{ color: '#432C63' }}
				>
					See all vouchers
				</Link>
			</div>

			{/* Horizontal scrollable cards */}
			<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
				{list.map((voucher) => {
					const isExpired =
						voucher.expires_at && new Date(voucher.expires_at) < new Date()

					return (
						<div
							key={voucher.id}
							className={`flex-shrink-0 flex rounded-xl overflow-hidden border min-w-[200px] max-w-[220px] ${
								isExpired ? 'opacity-50' : ''
							}`}
							style={{ borderColor: '#e5e7eb' }}
						>
							{/* Left accent */}
							<div
								className="w-2 flex-shrink-0"
								style={{ backgroundColor: '#432C63' }}
							/>

							<div className="flex-1 p-3 bg-white flex flex-col justify-between gap-2">
								<div>
									<div
										className="text-lg font-bold leading-tight"
										style={{ color: '#111827' }}
									>
										{voucher.discount_label}
									</div>
									{voucher.min_order && (
										<div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
											Min. ₱{voucher.min_order.toLocaleString()}
										</div>
									)}
									{voucher.expires_at && !isExpired && (
										<div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
											Expires{' '}
											{new Date(voucher.expires_at).toLocaleDateString('en-PH', {
												month: 'short',
												day: 'numeric',
											})}
										</div>
									)}
								</div>

								<div className="flex items-center justify-between">
									<code
										className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
										style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
									>
										{voucher.code}
									</code>

									{isExpired ? (
										<span className="text-xs text-gray-400">Expired</span>
									) : voucher.is_collected ? (
										<span
											className="text-xs font-semibold px-2 py-1 rounded-lg"
											style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
										>
											✓ Saved
										</span>
									) : (
										<button
											onClick={() => handleCollect(voucher)}
											className="text-xs font-bold px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
											style={{ backgroundColor: '#432C63', color: '#FFC533' }}
										>
											Collect
										</button>
									)}
								</div>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
