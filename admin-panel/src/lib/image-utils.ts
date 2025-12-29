/**
 * Image utility functions for Admin Panel
 * Handles image URL processing and validation
 */

/**
 * Get absolute image URL
 * Converts relative paths to absolute URLs using the backend URL
 */
export const getImageUrl = (image: string | null | undefined): string => {
	if (!image || typeof image !== 'string' || image.trim() === '') {
		return '';
	}

	const trimmedImage = image.trim();
	
	// Get backend URL from environment (Vite uses VITE_ prefix)
	const backendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL || 
		'http://localhost:9000';
	
	// Remove trailing slash
	const normalizedBackendUrl = backendUrl.replace(/\/$/, '');

	// Already a full URL with http:// or https://
	if (trimmedImage.startsWith('http://') || trimmedImage.startsWith('https://')) {
		// Replace localhost URL with production backend URL
		if (trimmedImage.startsWith('http://localhost:9000')) {
			return trimmedImage.replace('http://localhost:9000', normalizedBackendUrl);
		}
		// Return other absolute URLs as-is (CDN, S3, etc.)
		return trimmedImage;
	}

	// Protocol-relative URLs
	if (trimmedImage.startsWith('//')) {
		return trimmedImage;
	}

	// Relative paths without leading slash
	if (!trimmedImage.startsWith('/')) {
		return `${normalizedBackendUrl}/${trimmedImage}`;
	}

	// Absolute paths with leading slash
	return `${normalizedBackendUrl}${trimmedImage}`;
};

/**
 * Get image URL with fallback
 */
export const getImageUrlWithFallback = (
	image: string | null | undefined,
	fallback: string = '/placeholder.svg'
): string => {
	const url = image ? getImageUrl(image) : '';
	return url || fallback;
};

/**
 * Validate image file
 */
export const validateImageFile = (
	file: File,
	maxSizeMB: number = 5,
	allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } => {
	// Check file type
	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`,
		};
	}

	// Check file size
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	if (file.size > maxSizeBytes) {
		return {
			valid: false,
			error: `File size exceeds ${maxSizeMB}MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
		};
	}

	return { valid: true };
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if URL is valid
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

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				resolve({ width: img.width, height: img.height });
			};
			img.onerror = reject;
			img.src = e.target?.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
};




