'use client';

import { Upload, X } from '@medusajs/icons';
import clsx from 'clsx';
import Image from 'next/image';
import { useCallback, useState } from 'react';

import { Button } from '@/components/atoms';
import { getImageConfig } from '@/lib/config/image-config';
import {
	formatFileSize,
	uploadImage,
	validateImageFile,
	type ImageUploadConfig,
	type ImageUploadResult,
} from '@/lib/utils/image-upload';

export interface ImageUploaderProps {
	value?: string | string[];
	onChange?: (url: string | string[]) => void;
	onError?: (error: string) => void;
	multiple?: boolean;
	maxFiles?: number;
	config?: ImageUploadConfig;
	className?: string;
	label?: string;
	description?: string;
	disabled?: boolean;
	showPreview?: boolean;
	endpoint?: string;
}

/**
 * Production-grade image uploader component
 * 
 * Features:
 * - Drag & drop support
 * - Multiple file upload
 * - Image preview
 * - Progress indication
 * - Validation & error handling
 * - Responsive design
 */
export const ImageUploader = ({
	value,
	onChange,
	onError,
	multiple = false,
	maxFiles = 10,
	config,
	className,
	label = 'Upload Images',
	description,
	disabled = false,
	showPreview = true,
	endpoint = '/admin/uploads',
}: ImageUploaderProps) => {
	const [uploading, setUploading] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const imageConfig = getImageConfig();

	// Convert value to array for consistent handling
	const images = Array.isArray(value) ? value : value ? [value] : [];

	const handleFiles = useCallback(
		async (files: FileList | null) => {
			if (!files || files.length === 0 || disabled) return;

			setUploading(true);
			setUploadProgress(0);

			const fileArray = Array.from(files);
			const validFiles: File[] = [];

			// Validate all files
			for (const file of fileArray) {
				const validation = validateImageFile(file, config);
				if (!validation.valid) {
					onError?.(validation.error || 'Invalid file');
					continue;
				}
				validFiles.push(file);
			}

			// Check max files limit
			const totalFiles = images.length + validFiles.length;
			if (totalFiles > maxFiles) {
				onError?.(
					`Maximum ${maxFiles} files allowed. You've selected ${totalFiles} files.`
				);
				setUploading(false);
				return;
			}

			// Upload files
			const uploadPromises = validFiles.map((file) =>
				uploadImage(file, endpoint, config)
			);

			try {
				const results: ImageUploadResult[] = await Promise.all(
					uploadPromises
				);

				const successfulUploads = results
					.filter((r) => r.success && r.url)
					.map((r) => r.url as string);

				const failedUploads = results.filter((r) => !r.success);

				if (failedUploads.length > 0) {
					const errorMsg = failedUploads
						.map((r) => r.error)
						.join(', ');
					onError?.(errorMsg);
				}

				if (successfulUploads.length > 0) {
					const newImages = multiple
						? [...images, ...successfulUploads]
						: [successfulUploads[0]];
					onChange?.(multiple ? newImages : newImages[0]);
				}

				setUploadProgress(100);
			} catch (error) {
				console.error('Upload error:', error);
				onError?.(
					error instanceof Error ? error.message : 'Upload failed'
				);
			} finally {
				setUploading(false);
				setTimeout(() => setUploadProgress(0), 1000);
			}
		},
		[
			images,
			multiple,
			maxFiles,
			onChange,
			onError,
			config,
			endpoint,
			disabled,
		]
	);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDragActive(false);
			if (!disabled) {
				handleFiles(e.dataTransfer.files);
			}
		},
		[handleFiles, disabled]
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			e.preventDefault();
			if (e.target.files) {
				handleFiles(e.target.files);
			}
		},
		[handleFiles]
	);

	const handleRemove = useCallback(
		(index: number) => {
			const newImages = images.filter((_, i) => i !== index);
			onChange?.(multiple ? newImages : '');
		},
		[images, multiple, onChange]
	);

	return (
		<div className={clsx('w-full', className)}>
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-2">
					{label}
				</label>
			)}

			{description && (
				<p className="text-sm text-gray-500 mb-4">{description}</p>
			)}

			{/* Upload Area */}
			<div
				className={clsx(
					'relative border-2 border-dashed rounded-lg p-6 transition-colors',
					dragActive
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-300 bg-gray-50',
					disabled && 'opacity-50 cursor-not-allowed',
					!disabled && 'hover:border-gray-400 cursor-pointer'
				)}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<input
					accept={imageConfig.allowedFormats.join(',')}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					disabled={disabled || uploading}
					multiple={multiple}
					onChange={handleChange}
					type="file"
				/>

				<div className="flex flex-col items-center justify-center text-center">
					<Upload className="w-12 h-12 text-gray-400 mb-4" />
					<p className="text-sm text-gray-600 mb-2">
						<span className="font-semibold text-blue-600">
							Click to upload
						</span>{' '}
						or drag and drop
					</p>
					<p className="text-xs text-gray-500">
						{imageConfig.allowedFormats
							.map((type) => type.split('/')[1].toUpperCase())
							.join(', ')}{' '}
						up to {imageConfig.maxFileSize}MB
					</p>
					{multiple && (
						<p className="text-xs text-gray-500 mt-1">
							Maximum {maxFiles} files
						</p>
					)}
				</div>

				{/* Upload Progress */}
				{uploading && uploadProgress > 0 && (
					<div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
						<div
							className="h-full bg-blue-500 transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
				)}
			</div>

			{/* Image Previews */}
			{showPreview && images.length > 0 && (
				<div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
					{images.map((image, index) => (
						<div key={index} className="relative group">
							<div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
								<Image
									alt={`Upload ${index + 1}`}
									className="object-cover"
									fill
									src={image}
								/>
							</div>
							{!disabled && (
								<button
									className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={() => handleRemove(index)}
									type="button"
								>
									<X size={16} />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{/* Info message */}
			{!uploading && images.length > 0 && (
				<p className="mt-2 text-xs text-gray-500">
					{images.length} image{images.length > 1 ? 's' : ''} uploaded
				</p>
			)}
		</div>
	);
};

export default ImageUploader;




