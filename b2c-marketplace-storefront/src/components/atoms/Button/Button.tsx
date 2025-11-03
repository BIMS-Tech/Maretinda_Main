import Spinner from '@/icons/spinner';
import { cn } from '@/lib/utils';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'filled' | 'tonal' | 'text' | 'destructive';
	size?: 'small' | 'large';
	loading?: boolean;
}

export function Button({
	children,
	variant = 'filled',
	size = 'small',
	loading = false,
	disabled = false,
	className,
	...props
}: ButtonProps) {
	const baseClasses =
		'text-md button-text rounded-sm disabled:bg-disabled disabled:text-disabled disabled:border-black/10 disabled:border dark:bg-action-tertiary dark:hover:bg-action-tertiary-hover dark:active:bg-action-tertiary-pressed dark:disabled:bg-disabled';

	const variantClasses = {
		destructive: `text-negative-on-primary bg-negative hover:bg-negative-hover active:bg-negative-pressed ${
			loading && 'button-text-filled'
		}`,
		filled: `bg-action text-action-on-primary hover:bg-action-hover active:bg-action-pressed ${
			loading && 'button-text-filled'
		}`,
		text: 'bg-primary dark:bg-primary hover:bg-action-secondary-hover active:bg-action-secondary-pressed text-primary',
		tonal: 'bg-action-secondary hover:bg-action-secondary-hover active:bg-action-secondary-pressed text-action-on-secondary',
	};

	const sizeClasses = {
		large: 'px-[24px] py-[8px]',
		small: 'px-[16px] py-[8px]',
	};

	return (
		<button
			className={cn(
				variantClasses[variant],
				sizeClasses[size],
				baseClasses,
				className,
			)}
			disabled={disabled}
			{...props}
		>
			{loading ? <Spinner /> : children}
		</button>
	);
}
