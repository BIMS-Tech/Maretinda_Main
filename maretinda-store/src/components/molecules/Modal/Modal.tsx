import { CloseIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const Modal = ({
	className,
	children,
	childrenClass,
	heading,
	headingClass,
	modalClass,
	onClose,
}: {
	className?: string;
	children: React.ReactNode;
	childrenClass?: string;
	headingClass?: string;
	heading: string;
	modalClass?: string;
	onClose: () => void;
}) => {
	return (
		<div
			className={cn(
				'fixed top-0 left-0 w-full h-full flex justify-center items-center z-30',
				className,
			)}
		>
			<div
				className="bg-tertiary/60 w-full h-full absolute backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				className={cn(
					'absolute bg-primary z-20 my-20 rounded-sm max-w-[600px] w-full max-h-[80vh] overflow-y-auto shadow-lg',
					modalClass,
				)}
			>
				<div
					className={cn(
						'flex justify-between items-center !text-lg border-b py-5',
						headingClass,
					)}
				>
					{heading}
					<div className="cursor-pointer" onClick={onClose}>
						<CloseIcon size={20} />
					</div>
				</div>
				<div className={cn('py-5', childrenClass)}>{children}</div>
			</div>
		</div>
	);
};
