import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL || 'https://maretinda.com').replace(/\/$/, '');
const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'ph';

/**
 * The public pages that always exist. Product, category and shop pages are
 * not listed yet: they need a paged read of the catalogue at build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	const pages = ['', '/categories', '/collections', '/sellers', '/flash-sale', '/vouchers', '/reels', '/help-center', '/terms', '/privacy'];
	return pages.map((path) => ({
		url: `${BASE}/${LOCALE}${path}`,
		changeFrequency: path === '' || path === '/flash-sale' ? 'daily' : 'weekly',
		priority: path === '' ? 1 : 0.6,
	}));
}
