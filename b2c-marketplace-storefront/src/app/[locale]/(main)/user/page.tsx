import Unauthorized from '@/app/unauthorized';
import { Layout } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';

export default async function UserPage() {
	const user = await retrieveCustomer();

	if (!user) return Unauthorized();

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<h1 className="heading-xl uppercase">
					Welcome {user.first_name}
				</h1>
				<p className="label-md">Your account is ready to go!</p>
			</div>
		</Layout>
	);
}
