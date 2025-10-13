import { LoaderIcon } from '@/icons';
import { cn } from '@/lib/utils';

interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	icon: React.ReactNode;
	variant?: 'filled' | 'tonal' | 'icon';
	size?: 'small' | 'large';
	loading?: boolean;
}

export function IconButton({
	icon,
	variant = 'filled',
	size = 'small',
	loading = false,
	className,
	...props
}: IconButtonProps) {
	const variantClasses = {
		filled: 'button-filled',
		icon: 'button-icon',
		tonal: 'button-tonal',
	};

	const sizeClasses = {
		large: 'h-[48px] w-[48px]',
		small: 'h-[40px] w-[40px]',
	};

	return (
		<button
			className={cn(
				variantClasses[variant],
				sizeClasses[size],
				'flex items-center justify-center rounded-sm transition-all duration-300 ease-out',
				className,
			)}
			{...props}
		>
			{loading ? <LoaderIcon /> : icon}
		</button>
	);
}
