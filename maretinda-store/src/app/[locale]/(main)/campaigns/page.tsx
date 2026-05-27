import type { Metadata } from 'next'
import Link from 'next/link'
import { getActiveCampaigns } from '@/lib/data/vouchers'

export const metadata: Metadata = {
	title: 'Campaigns — Maretinda',
	description: 'Shop our latest sale events and collect exclusive vouchers.',
}

export const revalidate = 300

export default async function CampaignsPage() {
	const campaigns = await getActiveCampaigns()
	const now = new Date()

	return (
		<main className="min-h-[60vh]">
			{/* Hero */}
			<div className="w-full py-10 lg:py-14" style={{ backgroundColor: '#432C63' }}>
				<div className="max-w-5xl mx-auto px-4 lg:px-8">
					<h1 className="text-3xl font-bold font-lora" style={{ color: '#FFC533' }}>
						🛍️ Sale Campaigns
					</h1>
					<p className="text-white/80 text-sm mt-2">
						Shop our curated sale events. Collect campaign vouchers and save big.
					</p>
				</div>
			</div>

			<div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
				{campaigns.length === 0 ? (
					<div className="text-center py-20 text-gray-400">
						<div className="text-5xl mb-4">🛍️</div>
						<p className="text-lg font-medium">No active campaigns right now</p>
						<p className="text-sm mt-1">Check back soon!</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{campaigns.map((campaign) => {
							const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null
							const daysLeft = endsAt
								? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
								: null
							const voucherCount = campaign.promotions?.length ?? 0

							return (
								<Link
									key={campaign.id}
									href={`/campaigns/${campaign.id}`}
									className="flex flex-col rounded-2xl overflow-hidden border hover:shadow-md transition-shadow"
									style={{ borderColor: '#e5e7eb' }}
								>
									{/* Banner */}
									<div
										className="h-36 flex items-end p-4"
										style={{
											backgroundColor: '#372248',
											backgroundImage: campaign.banner_image
												? `url(${campaign.banner_image})`
												: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)',
											backgroundSize: 'cover',
											backgroundPosition: 'center',
											position: 'relative',
										}}
									>
										{campaign.banner_image && (
											<div className="absolute inset-0 bg-black/40" />
										)}
										{campaign.badge_label && (
											<span
												className="relative z-10 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
												style={{ backgroundColor: '#FFC533', color: '#432C63' }}
											>
												{campaign.badge_label}
											</span>
										)}
									</div>

									{/* Content */}
									<div className="p-4 flex-1 flex flex-col gap-2 bg-white">
										<h3 className="font-bold text-base" style={{ color: '#111827' }}>
											{campaign.name}
										</h3>
										{campaign.description && (
											<p className="text-sm text-gray-500 line-clamp-2">
												{campaign.description}
											</p>
										)}

										<div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: '#f3f4f6' }}>
											<span className="text-xs text-gray-500">
												🎟️ {voucherCount} voucher{voucherCount !== 1 ? 's' : ''}
											</span>
											{daysLeft !== null && (
												<span
													className="text-xs font-bold px-2 py-0.5 rounded-full"
													style={{
														backgroundColor: daysLeft <= 2 ? '#fef2f2' : '#fffbeb',
														color: daysLeft <= 2 ? '#ef4444' : '#92400e',
													}}
												>
													{daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}
												</span>
											)}
										</div>
									</div>
								</Link>
							)
						})}
					</div>
				)}
			</div>
		</main>
	)
}
