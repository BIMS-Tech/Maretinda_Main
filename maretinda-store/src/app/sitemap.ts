import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL || 'https://maretinda.com').replace(/\/$/, '');
const LOCALE = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'ph';
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

type Entry = { handle: string; updated_at?: string };

/** Products, shops and categories that can be bought from now; empty if the backend can't be reached. */
async function catalogue(): Promise<{ products: Entry[]; shops: Entry[]; categories: Entry[] }> {
	try {
		const res = await fetch(`${BACKEND_URL}/store/sitemap`, {
			headers: {
				'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
			},
			next: { revalidate: 3600 },
		});
		if (!res.ok) throw new Error(String(res.status));
		const json = await res.json();
		return {
			categories: json.categories ?? [],
			products: json.products ?? [],
			shops: json.shops ?? [],
		};
	} catch {
		return { categories: [], products: [], shops: [] };
	}
}

/**
 * The fixed public pages, then every product, shop and category that is open
 * for business. Refreshed hourly.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const pages = ['', '/categories', '/collections', '/sellers', '/flash-sale', '/vouchers', '/reels', '/help-center', '/terms', '/privacy'];
	const { products, shops, categories } = await catalogue();
	const listed = (prefix: string, entries: Entry[], priority: number): MetadataRoute.Sitemap =>
		entries
			.filter((e) => e.handle)
			.map((e) => ({
				changeFrequency: 'weekly' as const,
				lastModified: e.updated_at ? new Date(e.updated_at) : undefined,
				priority,
				url: `${BASE}/${LOCALE}/${prefix}/${encodeURIComponent(e.handle)}`,
			}));

	return [
		...pages.map((path) => ({
			changeFrequency: path === '' || path === '/flash-sale' ? ('daily' as const) : ('weekly' as const),
			priority: path === '' ? 1 : 0.6,
			url: `${BASE}/${LOCALE}${path}`,
		})),
		...listed('categories', categories, 0.7),
		...listed('products', products, 0.8),
		...listed('sellers', shops, 0.5),
	];
}
