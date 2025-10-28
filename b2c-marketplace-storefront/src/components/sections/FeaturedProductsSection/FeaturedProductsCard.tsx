'use client';

import { ArrowLongRight } from '@medusajs/icons';

import { Card } from '@/components/atoms';
import { cn } from '@/lib/utils';

type FeaturedProductsCardProps = {
	bgColor?: string;
	buttonUrl?: string;
	children: React.ReactNode;
	className?: string;
	size?: string;
	title: string;
};

const FeaturedProductsCard: React.FC<FeaturedProductsCardProps> = ({
	bgColor = '#FFE3DA',
	buttonUrl,
	children,
	className,
	size = 'small',
	title,
}) => {
	console.log(bgColor);
	return (
		<Card
			className={cn(
				'group w-full rounded-xl shadow-xl transition-shadow duration-250 relative overflow-hidden h-[225px] md:h-[250px] lg:h-[325px]',
				'group-hover:shadow-inner group-hover:shadow-black/20',
				size === 'small'
					? 'md:col-span-2 lg:col-span-3'
					: 'md:col-span-3 lg:col-span-5',
				className,
			)}
			style={{ backgroundColor: bgColor }}
		>
			<div className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none transition-opacity duration-250 ease-in-out rounded-b-xl z-30 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/75 to-transparent" />
			<div
				className={`relative flex flex-col h-full justify-between px-4 z-40`}
			>
				<div className="py-4">
					<h2
						className={`text-2xl md:text-3xl lg:text-4xl font-bold font-lora text-[#372248] mb-4`}
					>
						{title}
					</h2>
				</div>

				<div className="mt-8 py-2 opacity-0 transform translate-y-full transition-all duration-250 ease-out group-hover:opacity-100 group-hover:translate-y-0">
					<a
						className="inline-flex gap-[6px] rounded-[6px] text-black text-xs md:text-sm lg:text-base bg-[#FFC533] py-[9px] px-4 mt-4 items-center"
						href={buttonUrl}
					>
						Shop Now{' '}
						<ArrowLongRight color="black" height={15} width={15} />
					</a>
				</div>
			</div>
			{children}
		</Card>
	);
};

export default FeaturedProductsCard;
