import { redirect } from 'next/navigation';

import { ProfileDetails } from '@/components/molecules';
import { ProfilePassword } from '@/components/molecules/ProfileDetails/ProfilePassword';
import { Layout } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';

export default async function ReviewsPage() {
	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<h1 className="mb-14 font-lora font-bold text-4xl text-black">
					Settings
				</h1>
				<div className="flex flex-col gap-12">
					<ProfileDetails user={user} />
					<ProfilePassword user={user} />
				</div>
			</div>
		</Layout>
	);
}
