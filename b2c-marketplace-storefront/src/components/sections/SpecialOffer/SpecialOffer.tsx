// HomePage.tsx

// 🎯 Biome Fix: Import the CarouselSlide type along with the component.
import DiscountCarousel, { type CarouselSlide } from './DiscountCarousel';

// Define the demo data using the now imported type
const demoSlides: CarouselSlide[] = [
	{
		// Biome: assist.actions.source.useSortedKeys - Properties are already sorted
		// in your example, which aligns with the Biome preference for JSON-like objects.
		badgeText: 'iPhone 14 Series',
		ctaLink: '/shop/iphone',
		ctaText: 'Shop Now',
		id: 'slide-1',
		// imageUrl: 'https://dummyimage.com/1200x400/000/fff',
		imageUrl: '/images/banner-section/Image.jpg',
		title: 'Up to 10% off',
		voucherText: 'Voucher',
	},
	{
		// Biome: assist.actions.source.useSortedKeys - Properties are already sorted
		// in your example, which aligns with the Biome preference for JSON-like objects.
		badgeText: 'iPhone 15 Series',
		ctaLink: '/shop/iphone',
		ctaText: 'Shop Now',
		id: 'slide-2',
		// imageUrl: 'https://dummyimage.com/1200x400/000/fff',
		imageUrl: '/images/banner-section/Image.jpg',
		title: 'Up to 20% off',
		voucherText: 'Voucher',
	},
	// Add more slides here...
];

// const demoSlides: CarouselSlide[] = [
//     // Slide 1: iPhone Promotion (Original)
//     {
//         badgeText: 'iPhone 14 Series',
//         ctaLink: '/shop/iphone',
//         ctaText: 'Shop Now',
//         id: 'slide-1',
//         imageUrl: '/images/iphone-promo.webp',
//         title: 'Up to 10% off',
//         voucherText: 'Voucher',
//     },
//     // Slide 2: New Laptop Arrival
//     {
//         badgeText: 'New M3 Chip',
//         ctaLink: '/shop/macbooks',
//         ctaText: 'View Specs',
//         id: 'slide-2',
//         imageUrl: '/images/macbook-m3.webp',
//         title: 'The Powerhouse',
//         voucherText: 'MacBook Pro',
//     },
//     // Slide 3: Accessories Sale
//     {
//         badgeText: 'Limited Time Deal',
//         ctaLink: '/shop/accessories',
//         ctaText: 'Shop Accessories',
//         id: 'slide-3',
//         imageUrl: '/images/accessories-sale.webp',
//         title: 'Up to 50% off',
//         voucherText: 'Accessories Sale',
//     },
//     // Slide 4: Watch Fitness Campaign
//     {
//         badgeText: 'Summer Fitness',
//         ctaLink: '/campaigns/fitness',
//         ctaText: 'Start Training',
//         id: 'slide-4',
//         imageUrl: '/images/watch-fitness.webp',
//         title: 'Achieve Your Goals',
//         voucherText: 'New Apple Watch',
//     },
//     // Slide 5: AirPods Pro Offer
//     {
//         badgeText: 'Premium Audio',
//         ctaLink: '/shop/airpods',
//         ctaText: 'Buy Now',
//         id: 'slide-5',
//         imageUrl: '/images/airpods-promo.webp',
//         title: 'Noise Cancellation',
//         voucherText: 'AirPods Discount',
//     },
//     // Slide 6: iPad Back-to-School Campaign
//     {
//         badgeText: 'Education Discount',
//         ctaLink: '/campaigns/education',
//         ctaText: 'Save Now',
//         id: 'slide-6',
//         imageUrl: '/images/ipad-back-to-school.webp',
//         title: 'Ready for School',
//         voucherText: 'iPad Savings',
//     },
// ];

const SpecialOffer: React.FC = () => {
	return (
		<div className="w-full">
			{/* ... other content */}
			<DiscountCarousel slides={demoSlides} />
			{/* ... other content */}
		</div>
	);
};

export default SpecialOffer;
