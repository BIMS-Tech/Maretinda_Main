'use client';

import { ArrowRightRectangleIcon } from '@/icons/navigation';
import { signout } from '@/lib/data/customer';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
	isSidebar?: boolean;
	unstyled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const LogoutButton: React.FC<LogoutButtonProps> = ({
	unstyled,
	className,
	children,
	isSidebar,
}) => {
	const handleLogout = async () => {
		await signout();
	};

	return (
		<button
			className={cn(
				!unstyled &&
					'label-md !font-medium text-black capitalize px-6 py-2.5 my-3 md:my-2.5 flex items-center gap-4',
				className,
			)}
			onClick={handleLogout}
			type="button"
		>
			{isSidebar && <ArrowRightRectangleIcon />}
			{children || 'Logout'}
		</button>
	);
};
