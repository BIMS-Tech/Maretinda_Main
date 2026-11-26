'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';

import { Segmented } from '@/components/motion';

import { navigation } from './navigation';

/** Reviews still to write, and the ones written. */
export const ReviewsTabs = () => {
	const router = useRouter();
	const pathname = usePathname();
	const { locale } = useParams<{ locale: string }>();
	const current = navigation.find((item) => pathname === `/${locale}${item.href}`)?.href ?? navigation[0].href;
	return (
		<Segmented
			label="Reviews"
			onChange={(href) => router.push(`/${locale}${href}`)}
			options={navigation.map((item) => ({ label: item.label, value: item.href }))}
			tone="light"
			value={current}
		/>
	);
};
