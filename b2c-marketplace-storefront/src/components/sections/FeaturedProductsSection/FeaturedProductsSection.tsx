import type React from 'react';

import Heading from '@/components/atoms/Heading/Heading';

import FeaturedProductsContainer from './FeaturedProductsContainer';

type FeaturedProductsSectionProps = {
	title?: string;
};

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = () => {
	return (
		<section className="bg-primary w-full">
			<div className="mb-10">
				<Heading label="Featured Products" />
			</div>
			<FeaturedProductsContainer />
		</section>
	);
};

export default FeaturedProductsSection;
