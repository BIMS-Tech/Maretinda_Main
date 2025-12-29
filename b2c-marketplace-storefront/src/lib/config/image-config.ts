/**
 * Centralized Image Configuration
 * Used across all panels (storefront, admin, vendor)
 */

export interface ImageConfig {
	// Backend configuration
	backendUrl: string;
	uploadsEndpoint: string;
	staticPath: string;
	
	// CDN configuration (optional)
	cdnUrl?: string;
	cdnEnabled: boolean;
	
	// Upload constraints
	maxFileSize: number; // in MB
	allowedFormats: string[];
	maxDimensions: {
		width: number;
		height: number;
	};
	
	// Optimization settings
	compression: {
		quality: number;
		enabled: boolean;
	};
	
	// Thumbnail generation
	thumbnails: {
		enabled: boolean;
		sizes: Array<{
			name: string;
			width: number;
			height: number;
		}>;
	};
	
	// Placeholder images
	placeholders: {
		product: string;
		category: string;
		user: string;
		seller: string;
		general: string;
	};
}

/**
 * Get image configuration based on environment
 */
export const getImageConfig = (): ImageConfig => {
	const isDevelopment = process.env.NODE_ENV === 'development';
	const backendUrl = process.env.MEDUSA_BACKEND_URL || 
		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
		'http://localhost:9000';

	return {
		// Backend configuration
		backendUrl: backendUrl.replace(/\/$/, ''),
		uploadsEndpoint: '/admin/uploads',
		staticPath: '/static',
		
		// CDN configuration
		cdnUrl: process.env.NEXT_PUBLIC_CDN_URL,
		cdnEnabled: !!process.env.NEXT_PUBLIC_CDN_URL && !isDevelopment,
		
		// Upload constraints
		maxFileSize: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB) || 5,
		allowedFormats: [
			'image/jpeg',
			'image/jpg',
			'image/png',
			'image/webp',
			'image/gif',
		],
		maxDimensions: {
			width: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_WIDTH) || 2048,
			height: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_HEIGHT) || 2048,
		},
		
		// Optimization settings
		compression: {
			quality: Number(process.env.NEXT_PUBLIC_IMAGE_QUALITY) || 0.85,
			enabled: process.env.NEXT_PUBLIC_IMAGE_COMPRESSION !== 'false',
		},
		
		// Thumbnail generation
		thumbnails: {
			enabled: true,
			sizes: [
				{ name: 'thumbnail', width: 150, height: 150 },
				{ name: 'small', width: 300, height: 300 },
				{ name: 'medium', width: 600, height: 600 },
				{ name: 'large', width: 1024, height: 1024 },
			],
		},
		
		// Placeholder images
		placeholders: {
			product: '/images/product/placeholder.jpg',
			category: '/images/placeholder.svg',
			user: '/talkjs-placeholder.jpg',
			seller: '/talkjs-placeholder.jpg',
			general: '/images/placeholder.svg',
		},
	};
};

/**
 * Environment-specific configurations
 */
export const IMAGE_CONFIGS = {
	development: {
		maxFileSize: 10, // More lenient for development
		compression: { quality: 0.9, enabled: false },
	},
	staging: {
		maxFileSize: 5,
		compression: { quality: 0.85, enabled: true },
	},
	production: {
		maxFileSize: 5,
		compression: { quality: 0.80, enabled: true },
	},
};

/**
 * Get configuration for specific environment
 */
export const getEnvironmentConfig = (
	env: 'development' | 'staging' | 'production' = 'production'
): Partial<ImageConfig> => {
	return IMAGE_CONFIGS[env];
};

/**
 * Supported image formats with MIME types
 */
export const SUPPORTED_IMAGE_FORMATS = {
	JPEG: { mime: 'image/jpeg', extensions: ['.jpg', '.jpeg'] },
	PNG: { mime: 'image/png', extensions: ['.png'] },
	WEBP: { mime: 'image/webp', extensions: ['.webp'] },
	GIF: { mime: 'image/gif', extensions: ['.gif'] },
	SVG: { mime: 'image/svg+xml', extensions: ['.svg'] },
} as const;

/**
 * Image quality presets
 */
export const IMAGE_QUALITY_PRESETS = {
	low: 0.6,
	medium: 0.75,
	high: 0.85,
	maximum: 0.95,
} as const;

/**
 * Common image dimensions for different use cases
 */
export const IMAGE_DIMENSIONS = {
	// Product images
	productThumbnail: { width: 150, height: 150 },
	productCard: { width: 300, height: 300 },
	productDetail: { width: 800, height: 800 },
	productZoom: { width: 1600, height: 1600 },
	
	// Category images
	categoryCard: { width: 200, height: 200 },
	categoryBanner: { width: 1200, height: 400 },
	
	// User/Seller images
	avatar: { width: 150, height: 150 },
	profile: { width: 400, height: 400 },
	coverPhoto: { width: 1200, height: 400 },
	
	// Marketing/Banners
	heroBanner: { width: 1920, height: 600 },
	promotionBanner: { width: 1200, height: 300 },
	socialShare: { width: 1200, height: 630 },
} as const;

export default getImageConfig;




