// Main category structure for multi-category marketplace
export const primeCategories = {
	accessories: 'Accessories',
	fashion: 'Fashion & Apparel',
	food: 'Food Items',
	groceries: 'Groceries',
	shopping: 'Shopping',
	technology: 'Technology',
};

// Sub-categories for each main category
export const categoryStructure = {
	accessories: {
		'bags-wallets': 'Bags & Wallets',
		'beauty-care': 'Beauty & Personal Care',
		eyewear: 'Sunglasses & Eyewear',
		'home-accessories': 'Home Accessories',
		'jewelry-watches': 'Jewelry & Watches',
		'sports-accessories': 'Sports Accessories',
		'tech-accessories': 'Tech Accessories',
	},
	fashion: {
		'fashion-accessories': 'Fashion Accessories',
		footwear: 'Footwear',
		'kids-clothing': "Kids' Clothing",
		'mens-clothing': "Men's Clothing",
		'womens-clothing': "Women's Clothing",
	},
	food: {
		'baked-goods': 'Baked Goods',
		catering: 'Catering Services',
		'frozen-foods': 'Frozen Foods',
		'gourmet-specialty': 'Gourmet & Specialty',
		international: 'International Cuisine',
		'local-delicacies': 'Local Delicacies',
		'ready-meals': 'Ready-to-Eat Meals',
	},
	groceries: {
		beverages: 'Beverages',
		'dairy-eggs': 'Dairy & Eggs',
		'fresh-produce': 'Fresh Produce',
		'meat-seafood': 'Meat & Seafood',
		'organic-health': 'Organic & Health Foods',
		'pantry-essentials': 'Pantry Essentials',
		snacks: 'Snacks',
	},
	shopping: {
		automotive: 'Automotive',
		'books-media': 'Books & Media',
		electronics: 'Electronics & Gadgets',
		'home-garden': 'Home & Garden',
		'office-supplies': 'Office Supplies',
		'sports-outdoors': 'Sports & Outdoors',
		'toys-games': 'Toys & Games',
	},
	technology: {
		automotive: 'Automotive',
		'books-media': 'Books & Media',
		electronics: 'Electronics & Gadgets',
		'home-garden': 'Home & Garden',
		'office-supplies': 'Office Supplies',
		'sports-outdoors': 'Sports & Outdoors',
		'toys-games': 'Toys & Games',
	},
};

// Legacy categories for backward compatibility
export const categories = {
	accessories: 'Accessories',
	bags: 'Bags',
	brands: 'Brands',
	clothing: 'Clothing',
	footwear: 'Footwear',
	'new-in': 'New in',
	sale: 'Sale',
};

// Category themes and styling
export const categoryThemes = {
	// Existing marketplace categories
	accessories: {
		accent: '#F06292',
		bgClass: 'bg-purple-50',
		icon: '💎',
		primary: '#9C27B0',
		secondary: '#E91E63',
		textClass: 'text-purple-800',
	},
	fashion: {
		accent: '#666666',
		bgClass: 'bg-red-50',
		icon: '👗',
		primary: '#000000',
		secondary: '#333333',
		textClass: 'text-gray-800',
	},
	'food-items': {
		accent: '#FFEB3B',
		bgClass: 'bg-blue-50',
		icon: '🥘',
		primary: '#FF9800',
		secondary: '#FFC107',
		textClass: 'text-orange-800',
	},
	groceries: {
		accent: '#CDDC39',
		bgClass: 'bg-green-50',
		icon: '🍎',
		primary: '#4CAF50',
		secondary: '#8BC34A',
		textClass: 'text-green-800',
	},
	shopping: {
		accent: '#00BCD4',
		bgClass: 'bg-yellow-500',
		icon: '🛍️',
		primary: '#2196F3',
		secondary: '#03A9F4',
		textClass: 'text-blue-800',
	},
	// Current database categories
	sneakers: {
		accent: '#FF4081',
		bgClass: 'bg-pink-50',
		icon: '👟',
		primary: '#E91E63',
		secondary: '#F06292',
		textClass: 'text-pink-800',
	},
	sandals: {
		accent: '#FFD54F',
		bgClass: 'bg-amber-50',
		icon: '🩴',
		primary: '#FFA000',
		secondary: '#FFB300',
		textClass: 'text-amber-800',
	},
	boots: {
		accent: '#8D6E63',
		bgClass: 'bg-brown-50',
		icon: '🥾',
		primary: '#5D4037',
		secondary: '#6D4C41',
		textClass: 'text-brown-800',
	},
	sport: {
		accent: '#4CAF50',
		bgClass: 'bg-green-50',
		icon: '⚽',
		primary: '#2E7D32',
		secondary: '#43A047',
		textClass: 'text-green-800',
	},
	tops: {
		accent: '#42A5F5',
		bgClass: 'bg-blue-50',
		icon: '👕',
		primary: '#1976D2',
		secondary: '#1E88E5',
		textClass: 'text-blue-800',
	},
};
