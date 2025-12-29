import type { HttpTypes } from '@medusajs/types';

import Heading from '@/components/atoms/Heading/Heading';
import { Carousel } from '@/components/cells';
import { CategoryCard } from '@/components/organisms';
import { categoryThemes } from '@/data/categories';
import { listCategories } from '@/lib/data/categories';

export const HomeCategories = async ({ heading }: { heading: string }) => {
	const { categories } = (await listCategories()) as {
		categories: HttpTypes.StoreProductCategory[];
	};
	
	// Display top-level categories if no subcategories exist
	let categoriesToDisplay: HttpTypes.StoreProductCategory[] = [];
	
	// First, try to collect all subcategories
	categories.forEach((category) => {
		if (category.category_children && category.category_children.length > 0) {
			categoriesToDisplay = [...categoriesToDisplay, ...category.category_children];
		}
	});
	
	// If no subcategories found, display top-level categories
	if (categoriesToDisplay.length === 0) {
		categoriesToDisplay = categories;
	}

	return (
		<section className="bg-primary w-full">
			<div className="mb-10">
				<Heading label="Categories" />
			</div>
			<Carousel
				items={categoriesToDisplay?.map((category, index) => (
					<CategoryCard
						category={{
							description: category.description || category.name,
							handle: category.handle,
							id: index + 1,
							name: category.name,
							theme: categoryThemes[
								category.handle as keyof typeof categoryThemes
							],
						}}
						key={category.id}
					/>
				))}
			/>
		</section>
	);
};
