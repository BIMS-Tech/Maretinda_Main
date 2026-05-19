'use client';

import { useLanguage } from '@/providers/LanguageProvider';
import type { translations } from './translations';

type NavKey = keyof typeof translations.en.nav;

export function NavText({ k }: { k: NavKey }) {
	const { t } = useLanguage();
	return <>{t.nav[k]}</>;
}
