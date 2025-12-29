/**
 * Production-grade image URL handler
 * Handles various image URL formats and converts them to absolute URLs
 * 
 * @param image - The image path/URL to process
 * @returns Absolute URL for the image or empty string if invalid
 * 
 * Supported formats:
 * - Relative paths: "static/image.jpg" -> "http://backend-url/static/image.jpg"
 * - Localhost URLs: "http://localhost:9000/static/image.jpg" -> "http://backend-url/static/image.jpg"
 * - Absolute URLs: "https://cdn.example.com/image.jpg" -> unchanged
 * - Full backend URLs: Already correct -> unchanged
 */
export const getImageUrl = (image: string): string => {
	// Handle null/undefined/empty strings
	if (!image || typeof image !== 'string' || image.trim() === '') {
		return '';
	}

	const trimmedImage = image.trim();
	
	// Get backend URL from environment
	const backendUrl = process.env.MEDUSA_BACKEND_URL || 
		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 
		'http://localhost:9000';
	
	// Remove trailing slash from backend URL
	const normalizedBackendUrl = backendUrl.replace(/\/$/, '');

	// Case 1: Already a full URL with http:// or https://
	if (trimmedImage.startsWith('http://') || trimmedImage.startsWith('https://')) {
		// Replace localhost URL with production backend URL
		if (trimmedImage.startsWith('http://localhost:9000')) {
			return trimmedImage.replace('http://localhost:9000', normalizedBackendUrl);
		}
		// Return other absolute URLs as-is (could be CDN, S3, etc.)
		return trimmedImage;
	}

	// Case 2: Protocol-relative URLs (//cdn.example.com/image.jpg)
	if (trimmedImage.startsWith('//')) {
		return trimmedImage;
	}

	// Case 3: Relative paths without leading slash (static/image.jpg, uploads/image.jpg)
	if (!trimmedImage.startsWith('/')) {
		return `${normalizedBackendUrl}/${trimmedImage}`;
	}

	// Case 4: Absolute paths with leading slash (/static/image.jpg)
	return `${normalizedBackendUrl}${trimmedImage}`;
};

/**
 * Get image URL with fallback
 * @param image - Primary image path
 * @param fallback - Fallback image path (default: placeholder)
 * @returns Image URL with fallback
 */
export const getImageUrlWithFallback = (
	image: string | null | undefined,
	fallback: string = '/images/placeholder.svg'
): string => {
	const url = image ? getImageUrl(image) : '';
	return url || fallback;
};

/**
 * Check if image URL is valid
 * @param url - URL to validate
 * @returns boolean indicating if URL is valid
 */
export const isValidImageUrl = (url: string): boolean => {
	if (!url || typeof url !== 'string') return false;
	
	try {
		// For relative paths, prepend a base URL for validation
		const testUrl = url.startsWith('http') ? url : `http://example.com${url.startsWith('/') ? '' : '/'}${url}`;
		new URL(testUrl);
		return true;
	} catch {
		return false;
	}
};
