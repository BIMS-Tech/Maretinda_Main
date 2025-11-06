import { redirect } from 'next/navigation';

import { Addresses, Layout } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';
import { listRegions } from '@/lib/data/regions';

export default async function Page() {
	const user = await retrieveCustomer();
	const regions = await listRegions();

	if (!user) {
		redirect('/user');
	}

	return (
		<Layout>
			<Addresses {...{ regions, user }} />
		</Layout>
	);
}
