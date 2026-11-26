import type { ReactNode } from 'react';

import { AuthShell } from '@/components/organisms/AuthShell/AuthShell';

/** Signing in and creating an account share a page that stays put between them. */
export default function EntryLayout({ children }: { children: ReactNode }) {
	return <AuthShell>{children}</AuthShell>;
}
