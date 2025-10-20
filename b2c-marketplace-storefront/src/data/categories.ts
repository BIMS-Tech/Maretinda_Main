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
	accessories: {
		accent: '#F06292',
		bgClass: 'bg-purple-50',
		description: 'Stylish accessories for every occasion',
		icon: '💎',
		primary: '#9C27B0',
		secondary: '#E91E63',
		textClass: 'text-purple-800',
	},
	fashion: {
		accent: '#666666',
		bgClass: 'bg-red-50',
		description: 'Latest fashion trends and styles',
		icon: '👗',
		primary: '#000000',
		secondary: '#333333',
		textClass: 'text-gray-800',
	},
	food: {
		accent: '#FFEB3B',
		bgClass: 'bg-blue-50',
		description: 'Delicious meals and local delicacies',
		icon: '🥘',
		primary: '#FF9800',
		secondary: '#FFC107',
		textClass: 'text-orange-800',
	},
	groceries: {
		accent: '#CDDC39',
		bgClass: 'bg-green-50',
		description: 'Fresh groceries delivered to your door',
		icon: '🍎',
		primary: '#4CAF50',
		secondary: '#8BC34A',
		textClass: 'text-green-800',
	},
	shopping: {
		accent: '#00BCD4',
		bgClass: 'bg-yellow-500',
		description: 'Everything you need in one place',
		icon: '🛍️',
		primary: '#2196F3',
		secondary: '#03A9F4',
		textClass: 'text-blue-800',
	},
	technology: {
		accent: '#00BCD4',
		bgClass: 'bg-pink-50',
		description: 'Everything you need in one place',
		icon: '🛍️',
		primary: '#F506A4',
		secondary: '#03A9F4',
		textClass: 'text-blue-800',
	},
};
