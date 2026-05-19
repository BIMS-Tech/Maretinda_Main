'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { type Lang, translations } from '@/i18n/translations';

type LanguageCtx = {
	lang: Lang;
	t: typeof translations.en;
};

const LanguageContext = createContext<LanguageCtx>({
	lang: 'en',
	t: translations.en,
});

function readLang(): Lang {
	if (typeof document === 'undefined') return 'en';
	const match = document.cookie.split('; ').find((r) => r.startsWith('maretinda_lang='));
	return match?.split('=')[1] === 'fil' ? 'fil' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLang] = useState<Lang>('en');

	useEffect(() => {
		setLang(readLang());
	}, []);

	return (
		<LanguageContext.Provider value={{ lang, t: translations[lang] as typeof translations.en }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	return useContext(LanguageContext);
}
