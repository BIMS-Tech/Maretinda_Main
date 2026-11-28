import type { Metadata } from 'next';

import { VerifyEmail } from '@/components/molecules/VerifyEmail/VerifyEmail';
import { retrieveCustomer } from '@/lib/data/customer';

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Confirm your email',
};

export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const [{ token }, customer] = await Promise.all([
		searchParams,
		retrieveCustomer().catch(() => null),
	]);
	// Who this browser is signed in as, if anyone: the link is often opened somewhere else
	return <VerifyEmail token={token} viewer={customer?.email ?? null} />;
}
