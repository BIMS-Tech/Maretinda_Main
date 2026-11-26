'use client';

import * as m from 'motion/react-m';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { EASE_OUT, SPRING_SOFT } from '@/components/motion';
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
	children: ReactNode;
	childrenClass?: string;
	headingClass?: string;
	heading: string;
	modalClass?: string;
	onClose: () => void;
}) => {
	const id = useId();
	const panel = useRef<HTMLDivElement>(null);
	const close = useRef(onClose);
	close.current = onClose;

	useEffect(() => {
		const before = document.activeElement as HTMLElement | null;
		panel.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close.current();
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('keydown', onKey);
			before?.focus?.();
		};
	}, []);

	return (
		<div className={cn('fixed left-0 top-0 z-[70] flex h-full w-full items-center justify-center p-3', className)}>
			<m.div
				animate={{ opacity: 1 }}
				aria-hidden="true"
				className="absolute inset-0 bg-[#1E1430]/45 backdrop-blur-[3px]"
				initial={{ opacity: 0 }}
				onClick={onClose}
				transition={{ duration: 0.25, ease: EASE_OUT }}
			/>
			<m.div
				animate={{ opacity: 1, scale: 1, y: 0 }}
				aria-labelledby={id}
				aria-modal="true"
				className={cn('absolute z-20 my-20 max-h-[80vh] w-full max-w-[600px] overflow-y-auto overscroll-contain rounded-[24px] bg-primary shadow-[0_30px_80px_rgba(30,20,48,0.35)] outline-none', modalClass)}
				initial={{ opacity: 0, scale: 0.94, y: 24 }}
				ref={panel}
				role="dialog"
				tabIndex={-1}
				transition={SPRING_SOFT}
			>
				<div className={cn('flex items-center justify-between border-b py-5 !text-lg', headingClass)}>
					<span id={id}>{heading}</span>
					<button aria-label="Close" className="press flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F6F2FB]" onClick={onClose} type="button">
						<CloseIcon size={20} />
					</button>
				</div>
				<div className={cn('py-5', childrenClass)}>{children}</div>
			</m.div>
		</div>
	);
};
