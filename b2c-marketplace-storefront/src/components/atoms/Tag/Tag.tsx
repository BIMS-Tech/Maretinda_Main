import { cn } from '@/lib/utils';

interface TagProps {
	value?: React.ReactNode | string;
	className?: string;
}

export function Tag({ value, className }: TagProps) {
	const baseClasses =
		'flex px-1.5 py-0.5 text-[#9F1239] text-[11px] bg-[#FFE4E6] border border-[#FDA4AF] rounded-[50px]';

	return <span className={cn(baseClasses, className)}>{value}</span>;
}
