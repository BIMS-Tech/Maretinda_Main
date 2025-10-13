import Image from 'next/image';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const BannerSection = () => {
	return (
		<section className="bg-tertiary container text-tertiary">
			<div className="grid grid-cols-1 lg:grid-cols-2 items-center">
				<div className="py-6 px-6 flex flex-col h-full justify-between border border-secondary rounded-sm">
					<div className="mb-8 lg:mb-48">
						<span className="text-sm inline-block px-4 py-1 border border-secondary rounded-sm">
							#COLLECTION
						</span>
						<h1 className="display-sm">
							BOHO VIBES: WHERE COMFORT MEETS CREATIVITY
						</h1>
						<p className="text-lg text-tertiary max-w-lg">
							Discover boho styles that inspire adventure and
							embrace the beauty of the unconventional.
						</p>
					</div>
					<LocalizedClientLink href="/collections/boho">
						<Button className="w-fit bg-secondary/10" size="large">
							EXPLORE
						</Button>
					</LocalizedClientLink>
				</div>
				<div className="relative aspect-[4/3] lg:aspect-auto lg:h-full flex justify-end rounded-sm">
					<Image
						alt="Boho fashion collection - Model wearing a floral dress with yellow boots"
						className="object-cover object-top rounded-sm"
						height={600}
						priority
						src="/images/banner-section/Image.jpg"
						width={700}
					/>
				</div>
			</div>
		</section>
	);
};
