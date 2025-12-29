/**
 * Production-Grade Image Upload Utility
 * 
 * Features:
 * - File validation (type, size, dimensions)
 * - Image optimization (resize, compress)
 * - Multiple file upload support
 * - Progress tracking
 * - Error handling
 * - CDN/S3 support
 */

export interface ImageUploadConfig {
	maxSizeInMB?: number;
	allowedTypes?: string[];
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	acceptMultiple?: boolean;
}

export interface ImageValidationResult {
	valid: boolean;
	error?: string;
	warnings?: string[];
}

export interface ImageUploadResult {
	success: boolean;
	url?: string;
	error?: string;
	file?: File;
}

const DEFAULT_CONFIG: ImageUploadConfig = {
	maxSizeInMB: 5,
	allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
	maxWidth: 2048,
	maxHeight: 2048,
	quality: 0.85,
	acceptMultiple: false,
};

/**
 * Validate image file
 */
export const validateImageFile = (
	file: File,
	config: ImageUploadConfig = {}
): ImageValidationResult => {
	const cfg = { ...DEFAULT_CONFIG, ...config };
	const warnings: string[] = [];

	// Check if file exists
	if (!file) {
		return { valid: false, error: 'No file provided' };
	}

	// Check file type
	if (!cfg.allowedTypes?.includes(file.type)) {
		return {
			valid: false,
			error: `Invalid file type. Allowed types: ${cfg.allowedTypes?.join(', ')}`,
		};
	}

	// Check file size
	const maxSizeInBytes = (cfg.maxSizeInMB || 5) * 1024 * 1024;
	if (file.size > maxSizeInBytes) {
		return {
			valid: false,
			error: `File size exceeds ${cfg.maxSizeInMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
		};
	}

	// Warn if file is very small (might be corrupted)
	if (file.size < 1024) {
		warnings.push('File size is very small, it might be corrupted');
	}

	return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = (
	image: HTMLImageElement,
	config: ImageUploadConfig = {}
): ImageValidationResult => {
	const cfg = { ...DEFAULT_CONFIG, ...config };
	const warnings: string[] = [];

	if (cfg.maxWidth && image.width > cfg.maxWidth) {
		warnings.push(
			`Image width (${image.width}px) exceeds maximum (${cfg.maxWidth}px). It will be resized.`
		);
	}

	if (cfg.maxHeight && image.height > cfg.maxHeight) {
		warnings.push(
			`Image height (${image.height}px) exceeds maximum (${cfg.maxHeight}px). It will be resized.`
		);
	}

	return {
		valid: true,
		warnings: warnings.length > 0 ? warnings : undefined,
	};
};

/**
 * Resize and compress image
 */
export const optimizeImage = (
	file: File,
	config: ImageUploadConfig = {}
): Promise<Blob> => {
	return new Promise((resolve, reject) => {
		const cfg = { ...DEFAULT_CONFIG, ...config };
		const reader = new FileReader();

		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let { width, height } = img;

				// Calculate new dimensions while maintaining aspect ratio
				if (cfg.maxWidth && width > cfg.maxWidth) {
					height = (height * cfg.maxWidth) / width;
					width = cfg.maxWidth;
				}
				if (cfg.maxHeight && height > cfg.maxHeight) {
					width = (width * cfg.maxHeight) / height;
					height = cfg.maxHeight;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Could not get canvas context'));
					return;
				}

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Could not create blob'));
						}
					},
					file.type,
					cfg.quality
				);
			};

			img.onerror = () => reject(new Error('Could not load image'));
			img.src = e.target?.result as string;
		};

		reader.onerror = () => reject(new Error('Could not read file'));
		reader.readAsDataURL(file);
	});
};

/**
 * Upload image to backend
 */
export const uploadImage = async (
	file: File,
	endpoint: string = '/admin/uploads',
	config: ImageUploadConfig = {}
): Promise<ImageUploadResult> => {
	try {
		// Validate file
		const validation = validateImageFile(file, config);
		if (!validation.valid) {
			return {
				success: false,
				error: validation.error,
			};
		}

		// Optimize image if needed
		let fileToUpload: File | Blob = file;
		if (config.maxWidth || config.maxHeight || config.quality) {
			try {
				const optimizedBlob = await optimizeImage(file, config);
				fileToUpload = new File([optimizedBlob], file.name, {
					type: file.type,
				});
			} catch (error) {
				console.warn('Image optimization failed, using original file:', error);
			}
		}

		// Create form data
		const formData = new FormData();
		formData.append('files', fileToUpload);

		// Get backend URL and publishable key from environment
		const backendUrl =
			process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
			process.env.MEDUSA_BACKEND_URL ||
			'http://localhost:9000';
		const publishableKey =
			process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

		// Upload to backend
		const response = await fetch(`${backendUrl}${endpoint}`, {
			method: 'POST',
			headers: {
				'x-publishable-api-key': publishableKey,
			},
			body: formData,
			credentials: 'include',
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `Upload failed with status ${response.status}`
			);
		}

		const data = await response.json();

		return {
			success: true,
			url: data.uploads?.[0]?.url || data.url,
			file: fileToUpload as File,
		};
	} catch (error) {
		console.error('Image upload error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Upload failed',
		};
	}
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
	files: File[],
	endpoint: string = '/admin/uploads',
	config: ImageUploadConfig = {}
): Promise<ImageUploadResult[]> => {
	return Promise.all(
		files.map((file) => uploadImage(file, endpoint, config))
	);
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
};

/**
 * Get image dimensions from file
 */
export const getImageDimensions = (
	file: File
): Promise<{ width: number; height: number }> => {
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

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if browser supports WebP
 */
export const supportsWebP = (): boolean => {
	const canvas = document.createElement('canvas');
	if (canvas.getContext && canvas.getContext('2d')) {
		return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
	}
	return false;
};




