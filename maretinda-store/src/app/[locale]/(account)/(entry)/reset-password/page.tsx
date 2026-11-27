import type { Metadata } from 'next';

import { ResetPasswordForm } from '@/components/molecules/ResetPasswordForm/ResetPasswordForm';

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Set a new password',
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
	const { token } = await searchParams;
	return <ResetPasswordForm token={token} />;
}
