import { cookies } from 'next/headers';

import { translations, type Lang } from './translations';

export async function getServerT() {
	const cookieStore = await cookies();
	const lang = (cookieStore.get('maretinda_lang')?.value === 'fil' ? 'fil' : 'en') as Lang;
	return { t: translations[lang], lang };
}
