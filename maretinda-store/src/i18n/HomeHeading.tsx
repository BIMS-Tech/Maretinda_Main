'use client';

import { SectionHeading } from '@/components/motion/SectionHeading';
import { useLanguage } from '@/providers/LanguageProvider';

import type { translations } from './translations';

type HomeKey = keyof typeof translations.en.home;

/** A home page section's heading, in the shopper's language. */
export function HomeHeading({ k, eyebrow, className, eyebrowClassName }: { k: HomeKey; eyebrow?: HomeKey; className?: string; eyebrowClassName?: string }) {
	const { t, lang } = useLanguage();
	return (
		<SectionHeading
			className={className}
			eyebrow={eyebrow && t.home[eyebrow]}
			eyebrowClassName={eyebrowClassName}
			key={lang}
			text={t.home[k]}
		/>
	);
}
