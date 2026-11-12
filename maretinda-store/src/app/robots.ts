import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_BASE_URL || 'https://maretinda.com').replace(/\/$/, '');

/** Test and preview builds stay out of search results; only the live domain is crawlable. */
export default function robots(): MetadataRoute.Robots {
	if (!/^https:\/\/(www\.)?maretinda\.com$/.test(BASE)) {
		return { rules: [{ userAgent: '*', disallow: '/' }] };
	}
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: ['/api/', '/*/user', '/*/cart', '/*/checkout', '/*/giyapay', '/*/payment-'],
			},
		],
		sitemap: `${BASE}/sitemap.xml`,
	};
}
