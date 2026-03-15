export const Dropdown = ({
	children,
	className,
	show,
}: {
	children: React.ReactNode;
	className?: string;
	show: boolean;
}) => {
	if (!show) return null;

	return (
		<div
			className={`absolute -right-2 bg-primary text-primary z-20 rounded-sm w-max shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)] ${className}`}
		>
			{children}
		</div>
	);
};
