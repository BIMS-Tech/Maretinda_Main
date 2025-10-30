import DiscountCarousel, { type CarouselSlide } from './DiscountCarousel';

const demoSlides: CarouselSlide[] = [
	{
		badgeText: 'iPhone 14 Series',
		ctaLink: '/shop/iphone',
		ctaText: 'Shop Now',
		id: 'slide-1',
		// imageUrl: 'https://dummyimage.com/1200x400/000/fff',
		imageUrl: '/images/banner-section/special-offer.png',
		title: 'Up to 10% off',
		voucherText: 'Voucher',
	},
	{
		badgeText: 'iPhone 15 Series',
		ctaLink: '/shop/iphone',
		ctaText: 'Shop Now',
		id: 'slide-2',
		// imageUrl: 'https://dummyimage.com/1200x400/000/fff',
		imageUrl: '/images/blog/post-1.jpg',
		title: 'Up to 20% off',
		voucherText: 'Voucher',
	},
	{
		badgeText: 'iPhone 15 Series',
		ctaLink: '/shop/iphone',
		ctaText: 'Shop Now',
		id: 'slide-2',
		// imageUrl: 'https://dummyimage.com/1200x400/000/fff',
		imageUrl: '/images/blog/post-2.jpg',
		title: 'Up to 20% off',
		voucherText: 'Voucher',
	},
	{
		badgeText: 'iPhone 15 Series',
		ctaLink: '/shop/iphone',
		ctaText: 'Shop Now',
		id: 'slide-2',
		// imageUrl: 'https://dummyimage.com/1200x400/000/fff',
		imageUrl: '/images/blog/post-3.jpg',
		title: 'Up to 20% off',
		voucherText: 'Voucher',
	},
];

const SpecialOffer: React.FC = () => {
	return (
		<div className="w-full">
			<DiscountCarousel slides={demoSlides} />
		</div>
	);
};

export default SpecialOffer;
