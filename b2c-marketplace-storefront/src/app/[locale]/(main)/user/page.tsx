import { redirect } from 'next/navigation';

import { Button } from '@/components/atoms/Button/Button';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { Layout } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';

export default async function UserPage() {
	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper text-black text-lg !font-normal">
				<div className="flex flex-col gap-4 justify-start">
					<h1 className="text-3xl capitalize text-black font-lora !font-bold">
						Welcome {user.first_name}
					</h1>
					<p>Your account is ready to go!</p>
				</div>
				<div className="flex flex-col gap-4 mt-12">
					<p>
						From your account dashboard you can view your{' '}
						<LocalizedClientLink
							className="underline underline-offset-4"
							href="#"
						>
							Recent orders
						</LocalizedClientLink>
						.
					</p>
					<p>
						Manage your{' '}
						<LocalizedClientLink
							className="underline underline-offset-4"
							href="#"
						>
							Shipping and Billing addresses
						</LocalizedClientLink>
						.
					</p>
					<p>
						Edit your{' '}
						<LocalizedClientLink
							className="underline underline-offset-4"
							href="#"
						>
							Password and Account details
						</LocalizedClientLink>
						.
					</p>
				</div>
				<div className="flex mt-14 lg:!px-6 !py-[22px] user-content-wrapper">
					<div className="flex flex-col lg:flex-row lg:items-center justify-between lg:px-7 w-full gap-5 lg:gap-10">
						<div className="flex flex-col justify-between gap-1">
							<h4 className="text-xl !font-semibold">
								Become a Vendor
							</h4>
							<p>
								Vendors can sell products and manage a store
								with a vendor dashboard.
							</p>
						</div>
						<Button className="rounded-sm bg-action text-action-on-primary !font-medium h-[40px] w-fit min-w-[129px] text-[13px] px-3.5">
							Become a Seller
						</Button>
					</div>
				</div>
			</div>
		</Layout>
	);
}
