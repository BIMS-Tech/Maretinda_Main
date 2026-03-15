import { redirect } from 'next/navigation';

import { Addresses, Layout } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';
import { listRegions } from '@/lib/data/regions';

export default async function Page() {
	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	const regions = await listRegions();

	return (
		<Layout>
			<Addresses {...{ regions, user }} />
		</Layout>
	);
}
