import { redirect } from 'next/navigation'
import Link from 'next/link'
import { retrieveCustomer } from '@/lib/data/customer'
import { getMyVouchers } from '@/lib/data/vouchers'
import { Layout } from '@/components/organisms'
import { AccountHeading } from '@/components/organisms/Layout/AccountHeading'
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
				<AccountHeading
					aside={
						<Link className="press inline-flex h-10 items-center rounded-full bg-[#432C63] px-5 text-[13px] font-bold text-white hover:bg-[#372248]" href="/vouchers">
							Collect more
						</Link>
					}
					title="My vouchers"
				/>
				<UserVouchersClient vouchers={vouchers} />
			</div>
		</Layout>
	)
}
