'use client';

import { useLanguage } from '@/providers/LanguageProvider';
import type { translations } from './translations';

type HomeKey = keyof typeof translations.en.home;

export function HomeText({ k }: { k: HomeKey }) {
	const { t } = useLanguage();
	return <>{t.home[k]}</>;
}
