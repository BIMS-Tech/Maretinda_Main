import Link from 'next/link'
import type { Metadata } from 'next'
import { getActiveCampaigns } from '@/lib/data/vouchers'

function CampaignCard({ campaign }: { campaign: any }) {
	const now = new Date()
	const endsAt = campaign.ends_at ? new Date(campaign.ends_at) : null
	const daysLeft = endsAt
		? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
		: null

	const voucherCount = campaign.promotions?.length ?? 0

	return (
		<Link
			href={`/campaigns/${campaign.id}`}
			className="relative flex flex-col justify-between rounded-2xl overflow-hidden min-h-[160px] p-5 flex-shrink-0 w-72 hover:opacity-95 transition-opacity"
			style={{
				backgroundColor: '#372248',
				backgroundImage: campaign.banner_image
					? `url(${campaign.banner_image})`
					: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)',
				backgroundSize: 'cover',
				backgroundPosition: 'center',
			}}
		>
			{/* Overlay for readability on images */}
			{campaign.banner_image && (
				<div className="absolute inset-0 bg-black/40" />
			)}

			<div className="relative z-10">
				{campaign.badge_label && (
					<span
						className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
						style={{ backgroundColor: '#FFC533', color: '#432C63' }}
					>
						{campaign.badge_label}
					</span>
				)}
				<h3
					className="text-lg font-bold font-lora leading-tight text-white"
				>
					{campaign.name}
				</h3>
				{campaign.description && (
					<p className="text-white/70 text-xs mt-1 line-clamp-2">
						{campaign.description}
					</p>
				)}
			</div>

			<div className="relative z-10 flex items-center justify-between mt-3">
				<div className="flex items-center gap-2">
					<span className="text-xs text-white/70">🎟️ {voucherCount} voucher{voucherCount !== 1 ? 's' : ''}</span>
					{daysLeft !== null && daysLeft <= 7 && (
						<span
							className="text-[10px] font-bold px-2 py-0.5 rounded-full"
							style={{ backgroundColor: daysLeft <= 2 ? '#ef4444' : '#FFC533', color: daysLeft <= 2 ? '#fff' : '#432C63' }}
						>
							{daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
						</span>
					)}
				</div>
				<span className="text-[11px] font-bold text-white/80">
					View →
				</span>
			</div>
		</Link>
	)
}

export default async function CampaignBanners() {
	const campaigns = await getActiveCampaigns()

	if (campaigns.length === 0) return null

	return (
		<section className="w-full">
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6">
				<div className="flex items-center justify-between mb-4">
					<h2
						className="text-xl font-bold font-lora"
						style={{ color: '#1B1B1B' }}
					>
						Active Campaigns
					</h2>
					<Link
						href="/campaigns"
						className="text-sm font-semibold underline underline-offset-4"
						style={{ color: '#432C63' }}
					>
						All campaigns
					</Link>
				</div>

				<div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
					{campaigns.map((c) => (
						<CampaignCard key={c.id} campaign={c} />
					))}
				</div>
			</div>
		</section>
	)
}
