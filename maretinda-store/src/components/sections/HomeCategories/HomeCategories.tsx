import type { HttpTypes } from '@medusajs/types';

import { Carousel } from '@/components/cells';
import { CategoryCard } from '@/components/organisms';
import { categoryThemes } from '@/data/categories';
import { listCategories } from '@/lib/data/categories';

export const HomeCategories = async (_: { heading: string }) => {
	const { categories } = (await listCategories()) as {
		categories: HttpTypes.StoreProductCategory[];
	};

	// Collect subcategories first; fall back to top-level
	let categoriesToDisplay: HttpTypes.StoreProductCategory[] = [];
	categories.forEach((category) => {
		if (category.category_children && category.category_children.length > 0) {
			categoriesToDisplay = [...categoriesToDisplay, ...category.category_children];
		}
	});
	if (categoriesToDisplay.length === 0) {
		categoriesToDisplay = categories;
	}

	if (categoriesToDisplay.length === 0) return null;

	return (
		<section className="w-full">
			<Carousel
				items={categoriesToDisplay.map((category, index) => (
					<CategoryCard
						key={category.id}
						category={{
							description: category.description || category.name,
							handle: category.handle,
							id: index + 1,
							image_url: (() => {
								const url = category.metadata?.image_url as string | undefined;
								return url && url.startsWith('http') ? url : '';
							})(),
							name: category.name,
							theme: categoryThemes[category.handle as keyof typeof categoryThemes],
						}}
					/>
				))}
			/>
		</section>
	);
};
