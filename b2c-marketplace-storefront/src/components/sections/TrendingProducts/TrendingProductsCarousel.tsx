'use client';

import type { HttpTypes } from '@medusajs/types';
import Slider from 'react-slick';

import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

import NextButton from '@/components/atoms/Button/NextButton';
import PrevButton from '@/components/atoms/Button/PrevButton';
import { ProductCard } from '@/components/organisms';
import type { Product } from '@/types/product';
import type { Wishlist } from '@/types/wishlist';

export const TrendingProductsCarousel = ({
	finalProducts,
	user,
	wishlist,
}: {
	finalProducts: Product[];
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	const settings = {
		autoplay: false,
		centerPadding: '0px',
		dots: false,
		infinite: true,
		initialSlide: 0,
		nextArrow: <NextButton />,
		pauseOnHover: true,
		prevArrow: <PrevButton />,
		responsive: [
			{
				breakpoint: 1280,
				settings: {
					slidesToScroll: 4,
					slidesToShow: 4,
				},
			},
			{
				breakpoint: 1200,
				settings: {
					slidesToScroll: 3,
					slidesToShow: 3,
				},
			},
			{
				breakpoint: 870,
				settings: {
					slidesToScroll: 2,
					slidesToShow: 2,
				},
			},
			{
				breakpoint: 575,
				settings: {
					slidesToScroll: 1,
					slidesToShow: 1,
				},
			},
		],
		slidesToScroll: 1,
		slidesToShow: 4,
		speed: 500,
		swipeToSlide: true,
	};

	return (
		<div className="slider-products w-full max-w-full mx-auto -mt-5">
			<Slider {...settings}>
				{finalProducts.map((product) => (
					<ProductCard
						api_product={
							product as unknown as HttpTypes.StoreProduct
						}
						key={product.id}
						product={product}
						user={user}
						wishlist={wishlist}
					/>
				))}
			</Slider>
		</div>
	);
};

export default TrendingProductsCarousel;
