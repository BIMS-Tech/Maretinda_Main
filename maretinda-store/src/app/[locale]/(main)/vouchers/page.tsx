import type { Metadata } from 'next'
import { getAvailableVouchers } from '@/lib/data/vouchers'
import { retrieveCustomer } from '@/lib/data/customer'
import VoucherPageClient from './VoucherPageClient'

export const metadata: Metadata = {
	title: 'Vouchers — Maretinda',
	description: 'Collect exclusive vouchers and save on your orders.',
}

export const revalidate = 60

export default async function VouchersPage() {
	const [vouchers, customer] = await Promise.all([
		getAvailableVouchers(),
		retrieveCustomer().catch(() => null),
	])

	return <VoucherPageClient vouchers={vouchers} isLoggedIn={!!customer} />
}
