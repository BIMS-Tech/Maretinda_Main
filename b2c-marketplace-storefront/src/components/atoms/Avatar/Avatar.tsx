import Image from 'next/image';

import { ProfileIcon } from '@/icons';
import { cn } from '@/lib/utils';

interface AvatarProps {
	src?: string;
	alt?: string;
	initials?: string;
	size?: 'small' | 'large';
	className?: string;
}

export function Avatar({
	src,
	alt,
	initials,
	size = 'small',
	className,
}: AvatarProps) {
	const baseClasses =
		'inline-flex items-center justify-center rounded-sm text-primary font-medium border';
	const sizeClasses = {
		large: 'w-12 h-12 text-lg !font-semibold',
		small: 'w-8 h-8 text-sm',
	};

	if (src) {
		return (
			<Image
				alt={alt || 'Avatar'}
				className={cn(
					baseClasses,
					sizeClasses[size],
					'object-cover',
					className,
				)}
				height={150}
				src={src}
				width={150}
			/>
		);
	}

	return (
		<div className={cn(baseClasses, sizeClasses[size], className)}>
			{initials || <ProfileIcon />}
		</div>
	);
}
