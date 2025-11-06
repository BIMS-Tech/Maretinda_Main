'use client';

import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export function CategoryCard({
	category,
}: {
	category: {
		id: number;
		name: string;
		description: string;
		handle: string;
		theme?: {
			primary: string;
			secondary: string;
			accent: string;
			icon: string;
			bgClass: string;
			textClass: string;
		};
	};
}) {
	const theme = category.theme || {
		bgClass: 'bg-gray-50',
		description: category.name,
		icon: '🛍️',
		primary: '#000000',
		textClass: 'text-gray-800',
	};

	return (
		<div className="px-2">
			<LocalizedClientLink
				// className={`relative flex flex-col items-center border rounded-lg transition-all hover:shadow-lg hover:scale-105 w-[280px] min-h-[320px] p-6 ${theme.bgClass}`}
				className="group relative flex flex-col items-center rounded-lg w-[188px] min-h-[235px]"
				href={`/categories/${category.handle}`}
				style={
					{
						'--category-primary': theme.primary,
						borderColor: theme.primary + '20',
					} as React.CSSProperties
				}
			>
				{/* Icon Section */}
				<div
					className={`flex items-center justify-center w-[188px] h-[188px] rounded-full mb-6 transition-all group-hover:shadow-lg ${theme.bgClass}`}
					style={{ backgroundColor: theme.primary + '15' }}
				>
					{/* <span className="text-4xl">{theme.icon}</span> */}
					<Image
						alt={category.name}
						className="object-contain rounded-lg transition-all group-hover:scale-125"
						height={150}
						onError={(e) => {
							// Fallback to a default image or hide if not found
							const target = e.target as HTMLImageElement;
							target.style.display = 'none';
						}}
						src={`/images/categories/${category.handle}.png`}
						width={150}
					/>
				</div>

				{/* Category Image */}
				{/* <div className="flex relative aspect-square overflow-hidden w-[120px] mb-4">
				<Image
					alt={category.name}
					className="object-contain rounded-lg"
					height={120}
					onError={(e) => {
						// Fallback to a default image or hide if not found
						const target = e.target as HTMLImageElement;
						target.style.display = 'none';
					}}
					src={`/images/categories/${category.handle}.png`}
					width={120}
				/>
				</div> */}

				{/* Category Info */}
				<h3 className={`!font-medium text-lg`}>{category.name}</h3>

				{/* <div className="text-center flex-1 flex flex-col justify-center">
				<h3 className={`font-bold text-xl mb-2 ${theme.textClass}`}>
					{category.name}
				</h3>
				<p className={`text-sm opacity-80 ${theme.textClass}`}>
					{theme.description}
				</p>
			</div> */}

				{/* Hover Effect */}
				{/* <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-lg opacity-0 transition-opacity hover:opacity-100" /> */}
			</LocalizedClientLink>
		</div>
	);
}
