import clsx from 'clsx';

import Heading from '@/components/atoms/Heading/Heading';
import type { Style } from '@/types/styles';

import { ShopByStyleContainer } from './ShopByStyleContainer';

export const styles: Style[] = [
	{
		description: 'Black and White version of the PS5 coming out on sale.',
		href: '/collections/gym',
		imageUrl: '/images/shop-by-styles/gym.png',
		name: 'GYM',
	},
	{
		description: 'tandard dummy text ever since the 1500s, when an unkn',
		href: '/collections/party',
		imageUrl: '/images/shop-by-styles/party.jpg',
		name: 'PARTY',
	},
	{
		description: 'Amazon wireless speakers',
		href: '/collections/casual',
		imageUrl: '/images/shop-by-styles/casual.png',
		name: 'CASUAL',
	},
	{
		description: 'GUCCI INTENSE OUD EDP',
		href: '/collections/formal',
		imageUrl: '/images/shop-by-styles/formal.png',
		name: 'FORMAL',
	},
];

export function ShopByStyleSection() {
	return (
		<section className="bg-primary container">
			<div className="mb-10">
				<Heading label="Shop By Style" />
			</div>
			<div
				className={clsx([
					'flex flex-col gap-5 lg:gap-0 lg:grid',
					'grid-cols-[minmax(0,_580px)_minmax(290px,_1fr)_minmax(280px,_296px)]',
					'grid-rows-[329px_316px]',
				])}
			>
				{styles.map((style, index) => (
					<ShopByStyleContainer
						className={clsx([
							index === 0 && 'hidden lg:block row-span-2',
							index === 1 && 'lg:ml-5 col-span-2',
							index === 2 && 'lg:ml-5 lg:mr-5 lg:mt-5',
							index === 3 && 'hidden lg:block lg:mt-5',
						])}
						description={style.description}
						href={style.href}
						imageUrl={style.imageUrl}
						index={index}
						key={style.name}
						name={style.name}
						secondary={index >= 2}
					/>
				))}
			</div>
		</section>
	);
}
