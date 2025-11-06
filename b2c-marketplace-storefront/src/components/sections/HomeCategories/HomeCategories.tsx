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
	let subCategories: HttpTypes.StoreProductCategory[] = [];

	categories.forEach((category) => {
		subCategories = [...subCategories, ...category.category_children];
	});

	return (
		<section className="bg-primary w-full">
			<div className="mb-10">
				<Heading label="Categories" />
			</div>
			<Carousel
				items={subCategories?.map((category, index) => (
					<CategoryCard
						category={{
							description: category.description,
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
