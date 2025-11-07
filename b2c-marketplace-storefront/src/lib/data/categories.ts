import type { HttpTypes } from '@medusajs/types';

import { sdk } from '@/lib/config';

interface CategoriesProps {
	query?: Record<string, any>;
	headingCategories?: string[];
}

export const listCategories = async ({
	query,
	headingCategories = [],
}: Partial<CategoriesProps> = {}) => {
	const limit = query?.limit || 100;

	const categories = await sdk.client
		.fetch<{
			product_categories: HttpTypes.StoreProductCategory[];
		}>('/store/product-categories', {
			cache: 'force-cache',
			query: {
				fields: [
					'category_children.handle',
					'category_children.name',
					'category_children.rank',
					'handle',
					'name',
					'rank',
					'parent_category_id',
				].join(', '),
				limit,
				...query,
			},
		})
		.then(({ product_categories }) => product_categories);

	const parentCategories = categories.filter(({ name }) =>
		headingCategories.includes(name.toLowerCase()),
	);

	const childrenCategories = categories.filter(
		({ name }) => !headingCategories.includes(name.toLowerCase()),
	);

	return {
		categories: childrenCategories.filter(
			({ parent_category_id }) => !parent_category_id,
		),
		parentCategories: parentCategories,
	};
};

export const getCategoryByHandle = async (categoryHandle: string[]) => {
	const handle = `${categoryHandle.join('/')}`;

	return sdk.client
		.fetch<HttpTypes.StoreProductCategoryListResponse>(
			`/store/product-categories`,
			{
				// next,
				cache: 'no-cache',
				query: {
					fields: '*category_children',
					handle,
				},
			},
		)
		.then(({ product_categories }) => product_categories[0]);
};
