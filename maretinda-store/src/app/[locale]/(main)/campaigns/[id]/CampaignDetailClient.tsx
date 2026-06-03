'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { VoucherPromotion } from '@/lib/data/vouchers'
import { collectVoucher } from '@/lib/data/vouchers'
import { toast } from '@/lib/helpers/toast'

interface Campaign {
	id: string
	name: string
	description: string | null
	starts_at: string | null
	ends_at: string | null
	banner_image: string | null
	badge_label: string | null
	budget: {
		limit: number | null
		used: number
		currency_code: string
		type: string
	} | null
	promotions: VoucherPromotion[]
}

interface CampaignProduct {
	id: string
	title: string
	handle: string
	thumbnail: string | null
	description: string | null
}

export default function CampaignDetailClient({
	campaign,
	products,
	isLoggedIn,
}: {
	campaign: Campaign
	products: CampaignProduct[]
	isLoggedIn: boolean
}) {
	const [vouchers, setVouchers] = useState<VoucherPromotion[]>(
		campaign.promotions
	)

	const now = new Date()
	const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null
	const startsAt = campaign.starts_at ? new Date(campaign.starts_at) : null
	const daysLeft = endsAt
		? Math.max(
				0,
				Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
		  )
		: null

	const handleCollect = async (voucher: VoucherPromotion) => {
		if (!isLoggedIn) {
			window.location.href = `/login?returnTo=/campaigns/${campaign.id}`
			return
		}
		const result = await collectVoucher(voucher.id)
		if (result.success) {
			toast.success({ title: `${voucher.code} added to your wallet!` })
			setVouchers((prev) =>
				prev.map((v) => (v.id === voucher.id ? { ...v, is_collected: true } : v))
			)
		} else {
			toast.error({ title: result.message || 'Could not collect voucher' })
		}
	}

	return (
		<main className="min-h-[60vh]">
			{/* Hero banner */}
			<div
				className="w-full relative flex items-end"
				style={{
					minHeight: '220px',
					backgroundColor: '#372248',
					backgroundImage: campaign.banner_image
						? `url(${campaign.banner_image})`
						: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			>
				{campaign.banner_image && (
					<div className="absolute inset-0 bg-black/50" />
				)}
				<div className="relative z-10 max-w-5xl mx-auto px-4 lg:px-8 w-full pb-8 pt-12">
					{campaign.badge_label && (
						<span
							className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							{campaign.badge_label}
						</span>
					)}
					<h1 className="text-3xl font-bold font-lora text-white">
						{campaign.name}
					</h1>
					{campaign.description && (
						<p className="text-white/70 text-sm mt-2">{campaign.description}</p>
					)}

					<div className="flex items-center gap-4 mt-3 text-sm text-white/60">
						{startsAt && (
							<span>
								From{' '}
								{startsAt.toLocaleDateString('en-PH', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
							</span>
						)}
						{endsAt && (
							<span>
								Ends{' '}
								{endsAt.toLocaleDateString('en-PH', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
								})}
								{daysLeft !== null && daysLeft <= 7 && (
									<span
										className="ml-2 font-bold px-2 py-0.5 rounded-full text-[10px]"
										style={{
											backgroundColor:
												daysLeft <= 2 ? '#ef4444' : '#FFC533',
											color: daysLeft <= 2 ? '#fff' : '#432C63',
										}}
									>
										{daysLeft === 0
											? 'Ends today'
											: `${daysLeft}d left`}
									</span>
								)}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Campaign Products */}
			{products.length > 0 && (
				<div className="max-w-5xl mx-auto px-4 lg:px-8 pt-8">
					<h2
						className="text-lg font-bold mb-5"
						style={{ color: '#111827' }}
					>
						🛍️ Campaign Products ({products.length})
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{products.map((product) => (
							<Link
								key={product.id}
								href={`/products/${product.handle}`}
								className="group flex flex-col rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow bg-white"
							>
								<div className="aspect-square relative bg-gray-50">
									{product.thumbnail ? (
										<Image
											src={product.thumbnail}
											alt={product.title}
											fill
											className="object-cover group-hover:scale-105 transition-transform duration-300"
											sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
										/>
									) : (
										<div
											className="absolute inset-0 flex items-center justify-center text-3xl"
											style={{ backgroundColor: '#f9fafb' }}
										>
											🛍️
										</div>
									)}
								</div>
								<div className="p-3">
									<p
										className="text-sm font-semibold line-clamp-2 leading-tight"
										style={{ color: '#111827' }}
									>
										{product.title}
									</p>
									<span
										className="inline-block mt-2 text-xs font-bold"
										style={{ color: '#432C63' }}
									>
										Shop now →
									</span>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Vouchers */}
			<div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
				<div className="flex items-center justify-between mb-5">
					<h2
						className="text-lg font-bold"
						style={{ color: '#111827' }}
					>
						🎟️ Campaign Vouchers ({vouchers.length})
					</h2>
					{isLoggedIn && (
						<Link
							href="/user/vouchers"
							className="text-sm underline underline-offset-4"
							style={{ color: '#432C63' }}
						>
							My wallet →
						</Link>
					)}
				</div>

				{vouchers.length === 0 ? (
					<p className="text-gray-400 text-sm">No vouchers in this campaign yet.</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{vouchers.map((v) => {
							const isExpired =
								v.expires_at && new Date(v.expires_at) < new Date()

							return (
								<div
									key={v.id}
									className={`flex rounded-xl overflow-hidden border ${
										isExpired ? 'opacity-50' : ''
									}`}
									style={{
										borderColor: v.is_collected ? '#432C63' : '#e5e7eb',
									}}
								>
									<div
										className="w-2.5 flex-shrink-0"
										style={{
											backgroundColor:
												v.scope === 'seller' ? '#432C63' : '#FFC533',
										}}
									/>
									<div className="flex-1 p-4 bg-white flex items-start justify-between gap-3">
										<div className="flex-1">
											<span
												className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
												style={{
													backgroundColor:
														v.scope === 'seller' ? '#f3eeff' : '#fffbeb',
													color:
														v.scope === 'seller' ? '#432C63' : '#92400e',
												}}
											>
												{v.scope === 'seller'
													? v.seller_name
														? `${v.seller_name}`
														: 'Seller'
													: 'Platform'}{' '}
												Voucher
											</span>
											<div className="text-2xl font-bold" style={{ color: '#111827' }}>
												{v.discount_label}
											</div>
											{v.min_order && (
												<div className="text-xs mt-0.5 text-gray-500">
													Min. ₱{v.min_order.toLocaleString()}
												</div>
											)}
											{v.description && (
												<div className="text-xs mt-1 text-gray-500">{v.description}</div>
											)}
										</div>

										<div className="flex flex-col items-end gap-2">
											<code
												className="font-mono text-xs font-bold px-2 py-1 rounded-md"
												style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
											>
												{v.code}
											</code>

											{isExpired ? (
												<span className="text-xs text-gray-400">Expired</span>
											) : v.is_collected ? (
												<span
													className="text-xs font-semibold px-3 py-1.5 rounded-lg"
													style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
												>
													✓ Collected
												</span>
											) : (
												<button
													onClick={() => handleCollect(v)}
													className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
													style={{ backgroundColor: '#432C63', color: '#FFC533' }}
												>
													{isLoggedIn ? 'Collect' : 'Login to collect'}
												</button>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}

				<div className="mt-8">
					<Link
						href="/campaigns"
						className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
					>
						← Back to campaigns
					</Link>
				</div>
			</div>
		</main>
	)
}
