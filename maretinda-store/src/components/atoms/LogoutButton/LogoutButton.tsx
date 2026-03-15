'use client';

import { useState } from 'react';

import { ArrowRightRectangleIcon } from '@/icons/navigation';
import Spinner from '@/icons/spinner';
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
	const [isLoading, setIsLoading] = useState(false);
	const handleLogout = async () => {
		setIsLoading(true);
		await signout();
		setIsLoading(false);
	};

	return (
		<button
			className={cn(
				!unstyled &&
					'label-md !font-medium text-black capitalize px-4 md:px-6 py-2.5 my-3 md:my-2.5 flex items-center gap-4',
				className,
			)}
			disabled={isLoading}
			onClick={handleLogout}
			type="button"
		>
			{isSidebar && !isLoading && <ArrowRightRectangleIcon />}
			{isLoading ? (
				<div className="flex items-center justify-center w-full">
					<Spinner />
				</div>
			) : (
				children || 'Logout'
			)}
		</button>
	);
};
