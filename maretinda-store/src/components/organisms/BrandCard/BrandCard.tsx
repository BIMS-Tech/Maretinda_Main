import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import type { Brand } from '@/types/brands';

interface BrandCardProps {
	brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
	return (
		<LocalizedClientLink href={brand.href}>
			<div className="relative border border-secondary rounded-sm bg-action h-[320px] w-[320px] 2xl:h-[400px] 2xl:w-[400px] flex items-center justify-center hover:rounded-full transition-all duration-200">
				<Image
					alt={brand.name}
					className="object-contain brightness-0 invert"
					fill
					src={decodeURIComponent(brand.logo)}
				/>
			</div>
		</LocalizedClientLink>
	);
}
