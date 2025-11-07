import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';
import { Layout } from '@/components/organisms';
import { UserMessagesSection } from '@/components/sections/UserMessagesSection/UserMessagesSection';
import { retrieveCustomer } from '@/lib/data/customer';

export default async function MessagesPage() {
	const user = await retrieveCustomer();

	if (!user) return <LoginForm />;

	return (
		<Layout>
			<div className="md:col-span-3 space-y-8 user-content-wrapper">
				<UserMessagesSection />
			</div>
		</Layout>
	);
}
