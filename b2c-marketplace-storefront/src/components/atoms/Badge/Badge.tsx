import type React from 'react';

// import { getStatusBadgeColors } from '@/lib/helpers/get-badge-color';
import { cn } from '@/lib/utils';

interface BadgeProps {
	children: React.ReactNode;
	className?: string;
	status?: string;
}

type OrderStatus = 'received' | 'pending' | 'delivered' | 'shipped';

const getStatusBadgeColors = (status: OrderStatus | string) => {
	const normalizedStatus = (status as string).toLowerCase().trim();

	switch (normalizedStatus) {
		case 'pending':
			return 'bg-[#FFEDD5]  border-[#FDBA74] text-[#9A3412]';

		case 'received':
			return 'bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]';
		default:
			return 'bg-gray-300 border-gray-700 text-gray-800';
	}
};

export function Badge({ children, className, status }: BadgeProps) {
	const statusColor = status && getStatusBadgeColors(status);
	return (
		<span
			className={cn(
				'inline-flex items-center justify-center px-2 py-1 label-sm leading-none text-action-on-primary bg-action rounded-xs',
				className,
				statusColor,
			)}
		>
			{children}
		</span>
	);
}
