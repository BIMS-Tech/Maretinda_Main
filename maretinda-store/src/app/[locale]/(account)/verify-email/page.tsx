import type { Metadata } from 'next';

import { VerifyEmail } from '@/components/molecules/VerifyEmail/VerifyEmail';

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Confirm your email',
};

export default async function VerifyEmailPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;
	return <VerifyEmail token={token} />;
}
