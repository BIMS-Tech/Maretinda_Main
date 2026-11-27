import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/components/molecules/ForgotPasswordForm/ForgotPasswordForm';

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Forgot your password?',
};

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}
