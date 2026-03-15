import type { HttpTypes } from '@medusajs/types';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const generateProductMetadata = async (
	product: HttpTypes.StoreProduct,
): Promise<Metadata> => {
	const headersList = await headers();
	const host = headersList.get('host');
	const protocol = headersList.get('x-forwarded-proto') || 'https';

	return {
		description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
		metadataBase: new URL(
			`${protocol}://${host}/products/${product?.handle}`,
		),

		openGraph: {
			description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
			images: [
				{
					alt: product?.title,
					height: 630,
					url:
						product?.thumbnail ||
						`${protocol}://${host}/images/placeholder.svg`,
					width: 1200,
				},
			],
			siteName: process.env.NEXT_PUBLIC_SITE_NAME,
			title: product?.title,
			type: 'website',
			url: `${protocol}://${host}/products/${product?.handle}`,
		},
		robots: 'index, follow',
		title: product?.title,
		twitter: {
			card: 'summary_large_image',
			description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
			images: [
				product?.thumbnail ||
					`${protocol}://${host}/images/placeholder.svg`,
			],
			title: product?.title,
		},
	};
};

export const generateCategoryMetadata = async (
	category: HttpTypes.StoreProductCategory,
) => {
	const headersList = await headers();
	const host = headersList.get('host');
	const protocol = headersList.get('x-forwarded-proto') || 'https';

	return {
		description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
		metadataBase: new URL(
			`${protocol}://${host}/categories/${category.handle}`,
		),

		openGraph: {
			description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
			images: [
				{
					alt: category.name,
					height: 630,
					url:
						`${protocol}://${host}/images/categories/${category.handle}.png` ||
						`${protocol}://${host}/images/placeholder.svg`,
					width: 1200,
				},
			],
			siteName: process.env.NEXT_PUBLIC_SITE_NAME,
			title: category.name,
			type: 'website',
			url: `${protocol}://${host}/categories/${category.handle}`,
		},
		robots: 'index, follow',
		title: `${category.name} Category`,
		twitter: {
			card: 'summary_large_image',
			description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
			images: [
				`${protocol}://${host}/images/categories/${category.handle}.png` ||
					`${protocol}://${host}/images/placeholder.svg`,
			],
			title: category.name,
		},
	};
};
