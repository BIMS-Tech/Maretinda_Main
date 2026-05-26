import { redirect } from 'next/navigation'
import Link from 'next/link'
import { retrieveCustomer } from '@/lib/data/customer'
import { getMyVouchers } from '@/lib/data/vouchers'
import { Layout } from '@/components/organisms'
import UserVouchersClient from './UserVouchersClient'

export default async function UserVouchersPage() {
	const customer = await retrieveCustomer()

	if (!customer) {
		redirect('/login?returnTo=/user/vouchers')
	}

	const vouchers = await getMyVouchers()

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper text-black">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold font-lora text-black">
						My Vouchers
					</h1>
					<Link
						href="/vouchers"
						className="text-sm font-semibold px-4 py-2 rounded-lg"
						style={{ backgroundColor: '#432C63', color: '#FFC533' }}
					>
						+ Collect More
					</Link>
				</div>
				<UserVouchersClient vouchers={vouchers} />
			</div>
		</Layout>
	)
}
