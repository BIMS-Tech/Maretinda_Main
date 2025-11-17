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
				'absolute bottom-0 right-0 pointer-events-none overflow-hidden flex justify-end items-end w-3/4 pr-8 md:pr-4',
				className,
			)}
		>
			<Image
				alt={title}
				className={cn(
					'object-cover object-center w-[55%] md:w-[75%] lg:w-full',
					imageClassName,
				)}
				fill={imageFill}
				height={height}
				sizes="100vw"
				src={imageUrl}
				width={width}
			/>
		</div>
	);
};

const CARD_DATA: Array<{
	bgColor: string;
	buttonUrl: string;
	className?: string;
	height?: number;
	id?: number;
	imageClassName?: string;
	imageFill?: boolean;
	imageUrl: string;
	size: string;
	title: string;
	width?: number;
}> = [
	{
		bgColor: '#FFE3DA',
		buttonUrl: '/ph/categories/fashion',
		id: 1,
		imageClassName: 'w-[45%] md:w-[80%] lg:w-[75%]',
		imageUrl: '/images/featured-products/fashion.png',
		size: 'large',
		title: 'Fashion',
	},
	{
		bgColor: '#FFE3DA',
		buttonUrl: '/ph/categories/sofa',
		className: 'w-full h-full',
		height: 0,
		id: 2,
		imageFill: true,
		imageUrl: '/images/featured-products/sofa.jpg',
		size: 'small',
		title: 'Sofa',
		width: 0,
	},
	{
		bgColor: '#FFF3D9',
		buttonUrl: '/ph/categories/food',
		className: 'w-3/4 md:w-full',
		height: 550,
		id: 3,
		imageClassName: 'w-[60%] md:w-[100%] lg:w-[90%]',
		imageUrl: '/images/featured-products/food.png',
		size: 'small',
		title: 'Food',
		width: 550,
	},
	{
		bgColor: '#A7E0B3',
		buttonUrl: '/ph/categories/toys',
		id: 4,
		imageClassName: 'w-[35%] md:w-full',
		imageUrl: '/images/featured-products/toy.png',
		size: 'small',
		title: 'Toy',
	},
	{
		bgColor: '#D8F5E0',
		buttonUrl: '/ph/categories/sneakers',
		id: 5,
		imageClassName: 'w-[40%] md:w-full',
		imageUrl: '/images/featured-products/sneakers.png',
		size: 'small',
		title: 'Sneaker',
	},
	{
		bgColor: '#DBEAFF',
		buttonUrl: '/ph/categories/groceries',
		id: 6,
		imageClassName: 'w-[60%] md:w-[90%]',
		imageUrl: '/images/featured-products/groceries.png',
		size: 'large',
		title: 'Groceries',
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
					key={card.id}
					size={card.size}
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
