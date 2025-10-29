import { LuCheck } from 'react-icons/lu';

import { cn } from '@/lib/utils';

interface ChipProps {
	value?: React.ReactNode | string;
	selected?: boolean;
	disabled?: boolean;
	color?: boolean;
	onSelect?: () => void;
	className?: string;
}

export function Chip({
	value,
	selected,
	disabled,
	color,
	onSelect,
	className,
}: ChipProps) {
	const baseClasses = 'chip-wrapper';
	const selectedClasses = selected ? 'border-primary' : '';
	const hoverClasses = !disabled && !selected ? 'hover:bg-gray-200' : '';
	const disabledClasses = disabled
		? 'bg-component border-disabled/50 hover:bg-component cursor-not-allowed text-disabled'
		: 'cursor-pointer';
	const colorClasses = color
		? 'w-[40px] h-[40px] border !rounded-full'
		: '!px-5';
	const selectedOtherVariantClasses =
		selected && !color ? '!bg-brandPurple text-white' : 'text-black';

	return (
		<div
			className={cn(
				baseClasses,
				colorClasses,
				selectedClasses,
				hoverClasses,
				disabledClasses,
				selectedOtherVariantClasses,
				className,
			)}
			data-disabled={disabled}
			onClick={!disabled ? onSelect : undefined}
			role="button"
			tabIndex={disabled ? -1 : 0}
		>
			{color ? (
				<div
					className={cn(
						'chip-color w-[34px] h-[34px] bg-action absolute top-[2px] left-[2px] rounded-full flex items-center justify-center',
						disabled && 'bg-disabled',
					)}
					style={{
						backgroundColor: (value || '').toString(),
					}}
				>
					{selected && (
						<LuCheck className="text-white bg-none" size={16} />
					)}
				</div>
			) : (
				value
			)}
		</div>
	);
}
