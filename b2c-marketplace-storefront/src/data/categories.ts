// Main category structure for multi-category marketplace
export const primeCategories = {
  groceries: 'Groceries',
  food: 'Food Items',
  accessories: 'Accessories',
  shopping: 'Shopping',
  fashion: 'Fashion & Apparel',
};

// Sub-categories for each main category
export const categoryStructure = {
  groceries: {
    'fresh-produce': 'Fresh Produce',
    'dairy-eggs': 'Dairy & Eggs',
    'meat-seafood': 'Meat & Seafood',
    'pantry-essentials': 'Pantry Essentials',
    'beverages': 'Beverages',
    'snacks': 'Snacks',
    'organic-health': 'Organic & Health Foods',
  },
  food: {
    'ready-meals': 'Ready-to-Eat Meals',
    'international': 'International Cuisine',
    'baked-goods': 'Baked Goods',
    'frozen-foods': 'Frozen Foods',
    'gourmet-specialty': 'Gourmet & Specialty',
    'local-delicacies': 'Local Delicacies',
    'catering': 'Catering Services',
  },
  accessories: {
    'jewelry-watches': 'Jewelry & Watches',
    'bags-wallets': 'Bags & Wallets',
    'eyewear': 'Sunglasses & Eyewear',
    'tech-accessories': 'Tech Accessories',
    'home-accessories': 'Home Accessories',
    'sports-accessories': 'Sports Accessories',
    'beauty-care': 'Beauty & Personal Care',
  },
  shopping: {
    'electronics': 'Electronics & Gadgets',
    'home-garden': 'Home & Garden',
    'books-media': 'Books & Media',
    'toys-games': 'Toys & Games',
    'sports-outdoors': 'Sports & Outdoors',
    'automotive': 'Automotive',
    'office-supplies': 'Office Supplies',
  },
  fashion: {
    'mens-clothing': "Men's Clothing",
    'womens-clothing': "Women's Clothing",
    'kids-clothing': "Kids' Clothing",
    'footwear': 'Footwear',
    'fashion-accessories': 'Fashion Accessories',
  },
};

// Legacy categories for backward compatibility
export const categories = {
  clothing: 'Clothing',
  footwear: 'Footwear',
  bags: 'Bags',
  accessories: 'Accessories',
  brands: 'Brands',
  'new-in': 'New in',
  sale: 'Sale',
};

// Category themes and styling
export const categoryThemes = {
  groceries: {
    primary: '#4CAF50',
    secondary: '#8BC34A',
    accent: '#CDDC39',
    icon: '🍎',
    bgClass: 'bg-green-50',
    textClass: 'text-green-800',
    description: 'Fresh groceries delivered to your door',
  },
  food: {
    primary: '#FF9800',
    secondary: '#FFC107',
    accent: '#FFEB3B',
    icon: '🥘',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    description: 'Delicious meals and local delicacies',
  },
  accessories: {
    primary: '#9C27B0',
    secondary: '#E91E63',
    accent: '#F06292',
    icon: '💎',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-800',
    description: 'Stylish accessories for every occasion',
  },
  shopping: {
    primary: '#2196F3',
    secondary: '#03A9F4',
    accent: '#00BCD4',
    icon: '🛍️',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    description: 'Everything you need in one place',
  },
  fashion: {
    primary: '#000000',
    secondary: '#333333',
    accent: '#666666',
    icon: '👗',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-800',
    description: 'Latest fashion trends and styles',
  },
};
