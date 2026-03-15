'use client';

import Image from 'next/image';
import type React from 'react';

import { cn } from '@/lib/utils';

import FeaturedProductsCard from './FeaturedProductsCard';

type FeaturedProductsSectionProps = {
	title?: string;
};

const renderImage = ({
	className,
	height = 250,
	imageClassName,
	imageFill = false,
	imageUrl,
	title,
	width = 250,
}: {
	className?: string;
	height?: number;
	imageClassName?: string;
	imageFill?: boolean;
	imageUrl: string;
	title: string;
	width?: number;
}) => {
	return (
		<div
			className={cn(
				'h-[325px] md:h-[390px] lg:h-[390px] absolute bottom-0 right-0 pointer-events-none overflow-hidden flex justify-end lg:justify-center items-end w-full',
				className,
			)}
		>
			<Image
				alt={title}
				className={cn(
					'object-contain object-bottom w-full h-full',
					imageClassName,
				)}
				fill={imageFill}
				height={height}
				// sizes="100vw"
				src={imageUrl}
				width={width}
			/>
		</div>
	);
};

const CARD_DATA: Array<{
	bgColor: string;
	buttonUrl: string;
	category: string;
	className?: string;
	height?: number;
	id?: number;
	imageClassName?: string;
	imageFill?: boolean;
	imageUrl: string;
	size: string;
	title: string;
	textColor: string;
	width?: number;
}> = [
	{
		bgColor: '#EEEEEE',
		buttonUrl: '/ph/categories/sofa',
		category: 'Home & Living',
		className: 'w-full h-full',
		id: 2,
		imageClassName: 'w-3/4 md:w-full',
		imageUrl: '/images/featured-products/sofa.png',
		size: 'large',
		textColor: '#444',
		title: 'Sofa',
	},
	{
		bgColor: '#D4EDF8',
		buttonUrl: '/ph/categories/sneakers',
		category: 'Clothing & Shoes',
		id: 5,
		imageClassName: 'w-3/4 md:w-full',
		imageUrl: '/images/featured-products/sneakers.png',
		size: 'small',
		textColor: '#0A73A1',
		title: 'Sneaker',
	},
	{
		bgColor: '#FEF9C4',
		buttonUrl: '/ph/categories/toys',
		category: 'Toys & Entertainment',
		id: 4,
		imageClassName: 'w-3/4 md:w-full',
		imageUrl: '/images/featured-products/toys.png',
		size: 'small',
		textColor: '#D4B100',
		title: 'Toys',
	},
	{
		bgColor: '#D8F5E0',
		buttonUrl: '/ph/categories/groceries',
		category: 'Food Items',
		id: 6,
		imageClassName: 'w-3/4 md:w-full',
		imageUrl: '/images/featured-products/groceries.png',
		size: 'small',
		textColor: '#25D02C',
		title: 'Groceries',
	},
	{
		bgColor: '#FFF3D9',
		buttonUrl: '/ph/categories/food',
		category: 'Food Items',
		className: 'w-3/4 md:w-full',
		id: 3,
		imageClassName: 'w-3/4 md:w-full',
		imageUrl: '/images/featured-products/food.png',
		size: 'small',
		textColor: '#D4B100',
		title: 'Food',
	},
	{
		bgColor: '#FFE9DA',
		buttonUrl: '/ph/categories/fashion',
		category: 'Fashion  & Apparel',
		id: 1,
		imageClassName: 'w-3/4 md:w-full',
		imageUrl: '/images/featured-products/fashion.png',
		size: 'large',
		textColor: '#C63D42',
		title: 'Fashion',
	},
];

const FeaturedProductsContainer: React.FC<
	FeaturedProductsSectionProps
> = () => {
	return (
		<div className="grid grid-cols-1 gap-5 md:grid-cols-7 lg:grid-cols-11 mx-auto">
			{CARD_DATA.map((card) => (
				<FeaturedProductsCard
					bgColor={card.bgColor}
					buttonUrl={card.buttonUrl}
					category={card.category}
					key={card.id}
					size={card.size}
					textColor={card.textColor}
					title={card.title}
				>
					{renderImage({
						className: card.className,
						height: card.height,
						imageClassName: card.imageClassName,
						imageFill: card.imageFill,
						imageUrl: card.imageUrl,
						title: card.title,
						width: card.width,
					})}
				</FeaturedProductsCard>
			))}
		</div>
	);
};

export default FeaturedProductsContainer;
