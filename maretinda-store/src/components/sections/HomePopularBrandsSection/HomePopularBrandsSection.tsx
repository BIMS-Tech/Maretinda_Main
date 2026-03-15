import { Carousel } from '@/components/cells';
import { BrandCard } from '@/components/organisms';
import type { Brand } from '@/types/brands';

const brands: Brand[] = [
	{
		href: '#',
		id: 1,
		logo: '/images/brands/Balenciaga.svg',
		name: 'Balenciaga',
	},
	{
		href: '#',
		id: 2,
		logo: '/images/brands/Nike.svg',
		name: 'Nike',
	},
	{
		href: '#',
		id: 3,
		logo: '/images/brands/Prada.svg',
		name: 'Prada',
	},
	{
		href: '#',
		id: 4,
		logo: '/images/brands/Miu-Miu.svg',
		name: 'Miu Miu',
	},
];

export function HomePopularBrandsSection() {
	return (
		<section className="bg-action px-4 py-8 md:px-6 lg:px-8 w-full">
			<div className="mb-6 flex items-center justify-between">
				<h2 className="heading-lg text-tertiary">POPULAR BRANDS</h2>
			</div>
			<Carousel
				items={brands.map((brand) => (
					<BrandCard brand={brand} key={brand.id} />
				))}
				variant="dark"
			/>
		</section>
	);
}
