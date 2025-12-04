'use client';

import { ArrowLongRight } from '@medusajs/icons';

import { Card } from '@/components/atoms';
import { cn } from '@/lib/utils';

type FeaturedProductsCardProps = {
	bgColor?: string;
	buttonUrl?: string;
	category: string;
	children: React.ReactNode;
	className?: string;
	size?: string;
	title: string;
	textColor?: string;
};

const FeaturedProductsCard: React.FC<FeaturedProductsCardProps> = ({
	bgColor = '#FFE3DA',
	buttonUrl,
	category,
	children,
	className,
	size = 'small',
	title,
	textColor = '#444',
}) => {
	return (
		<Card
			className={cn(
				'group w-full rounded-3xl duration-250 relative overflow-hidden h-[325px] md:h-[390px] lg:h-[390px] border-none px-4',
				'group-hover:shadow-inner group-hover:shadow-black/20',
				size === 'small'
					? 'md:col-span-2 lg:col-span-3'
					: 'md:col-span-3 lg:col-span-5',
				className,
			)}
			style={{ backgroundColor: bgColor }}
		>
			{/* <div className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none transition-opacity duration-250 ease-in-out rounded-b-xl z-30 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/75 to-transparent" /> */}
			<div className={`relative flex flex-col h-full p-4 z-40`}>
				<div className="flex flex-col gap-2 mb-6">
					<h3
						className="font-medium text-lg"
						style={{ color: textColor }}
					>
						{category}
					</h3>
					<h2
						className={`text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#4C4C4C]/65 uppercase`}
					>
						{title}
					</h2>
				</div>
				<div className="opacity-0 transform  transition-all duration-250 ease-out group-hover:opacity-100">
					<a
						className="inline-flex gap-[6px] rounded-[6px] text-black text-xs md:text-sm lg:text-sm bg-[#FFC533] py-[9px] px-4 items-center"
						href={buttonUrl}
					>
						Shop Now{' '}
						<ArrowLongRight color="black" height={15} width={15} />
					</a>
				</div>

				{/* <div className="mt-8 py-2 opacity-0 transform translate-y-full transition-all duration-250 ease-out group-hover:opacity-100 group-hover:translate-y-0">
					<a
						className="inline-flex gap-[6px] rounded-[6px] text-black text-xs md:text-sm lg:text-sm bg-[#FFC533] py-[9px] px-4 mt-4 items-center"
						href={buttonUrl}
					>
						Shop Now{' '}
						<ArrowLongRight color="black" height={15} width={15} />
					</a>
				</div> */}
			</div>
			{children}
		</Card>
	);
};

export default FeaturedProductsCard;
