import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCampaignDetail } from '@/lib/data/vouchers'
import { retrieveCustomer } from '@/lib/data/customer'
import CampaignDetailClient from './CampaignDetailClient'

export const revalidate = 60

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>
}): Promise<Metadata> {
	const { id } = await params
	const data = await getCampaignDetail(id).catch(() => null)
	return {
		title: data?.campaign ? `${data.campaign.name} — Maretinda` : 'Campaign — Maretinda',
	}
}

export default async function CampaignDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const [data, customer] = await Promise.all([
		getCampaignDetail(id).catch(() => null),
		retrieveCustomer().catch(() => null),
	])

	if (!data?.campaign) return notFound()

	return (
		<CampaignDetailClient
			campaign={data.campaign}
			products={data.products || []}
			productsTargeted={(data as any).products_targeted ?? (data.products || []).length > 0}
			isLoggedIn={!!customer}
		/>
	)
}
