import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/molecules';
import { retrieveCustomer } from '@/lib/data/customer';
import { safeReturnTo } from '@/lib/helpers/safe-return-to';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
	// Already signed in: carry on to where they were going
	if (await retrieveCustomer()) redirect(safeReturnTo((await searchParams).returnTo, '/user'));
	return <LoginForm />;
}
