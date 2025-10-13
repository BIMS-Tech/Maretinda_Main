import { Carousel } from '@/components/cells';
import { CategoryCard } from '@/components/organisms';
import { categoryThemes, primeCategories } from '@/data/categories';

export const categories: {
	id: number;
	name: string;
	handle: string;
	theme: {
		primary: string;
		secondary: string;
		accent: string;
		icon: string;
		bgClass: string;
		textClass: string;
		description: string;
	};
}[] = Object.entries(primeCategories).map(([handle, name], index) => ({
	handle,
	id: index + 1,
	name,
	theme: categoryThemes[handle as keyof typeof categoryThemes],
}));

export const HomeCategories = async ({ heading }: { heading: string }) => {
	return (
		<section className="bg-primary py-8 w-full">
			<div className="mb-6">
				<h2 className="heading-lg text-primary uppercase">{heading}</h2>
			</div>
			<Carousel
				items={categories?.map((category) => (
					<CategoryCard category={category} key={category.id} />
				))}
			/>
		</section>
	);
};
