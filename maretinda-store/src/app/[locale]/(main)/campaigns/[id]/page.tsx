import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActiveCampaigns } from '@/lib/data/vouchers'
import { retrieveCustomer } from '@/lib/data/customer'
import CampaignDetailClient from './CampaignDetailClient'

export const revalidate = 300

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>
}): Promise<Metadata> {
	const { id } = await params
	const campaigns = await getActiveCampaigns().catch(() => [])
	const campaign = campaigns.find((c: any) => c.id === id)
	return {
		title: campaign ? `${campaign.name} — Maretinda` : 'Campaign — Maretinda',
	}
}

export default async function CampaignDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const [campaigns, customer] = await Promise.all([
		getActiveCampaigns().catch(() => []),
		retrieveCustomer().catch(() => null),
	])

	const campaign = campaigns.find((c: any) => c.id === id)
	if (!campaign) return notFound()

	return (
		<CampaignDetailClient
			campaign={campaign}
			isLoggedIn={!!customer}
		/>
	)
}
