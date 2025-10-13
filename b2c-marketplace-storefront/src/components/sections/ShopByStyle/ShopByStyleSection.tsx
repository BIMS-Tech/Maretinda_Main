import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ArrowRightIcon } from '@/icons';
import type { Style } from '@/types/styles';

export const styles: Style[] = [
	{
		href: '/collections/luxury',
		id: 1,
		name: 'LUXURY',
	},
	{
		href: '/collections/vintage',
		id: 2,
		name: 'VINTAGE',
	},
	{
		href: '/collections/casual',
		id: 3,
		name: 'CASUAL',
	},
	{
		href: '/collections/streetwear',
		id: 4,
		name: 'STREETWEAR',
	},
	{
		href: '/collections/y2k',
		id: 5,
		name: 'Y2K',
	},
];

export function ShopByStyleSection() {
	return (
		<section className="bg-primary container">
			<h2 className="heading-lg text-primary mb-12">SHOP BY STYLE</h2>
			<div className="grid grid-cols-1 lg:grid-cols-2 items-center">
				<div className="py-[52px] px-[58px] h-full border rounded-sm">
					{styles.map((style) => (
						<LocalizedClientLink
							className="group flex items-center gap-4 text-primary hover:text-action transition-colors border-b border-transparent hover:border-primary w-fit pb-2 mb-8"
							href={style.href}
							key={style.id}
						>
							<span className="heading-lg">{style.name}</span>
							<ArrowRightIcon className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
						</LocalizedClientLink>
					))}
				</div>
				<div className="relative hidden lg:block">
					<Image
						alt="Models showcasing luxury fashion styles"
						className="object-cover rounded-sm w-full h-auto"
						height={600}
						priority
						src="/images/shop-by-styles/Image.jpg"
						width={700}
					/>
				</div>
			</div>
		</section>
	);
}
