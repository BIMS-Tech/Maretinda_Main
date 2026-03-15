'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/atoms';
import { CollapseIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const Accordion = ({
	children,
	heading,
	defaultOpen = true,
	filter = false,
}: {
	children: React.ReactNode;
	heading: string;
	defaultOpen?: boolean;
	filter?: boolean;
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [height, setHeight] = useState(0);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setTimeout(() => {
			if (contentRef.current) {
				setHeight(contentRef.current.scrollHeight);
			}
		}, 100);
	}, [children]);

	const openHandler = () => {
		setIsOpen(!isOpen);
	};

	return (
		<Card className={clsx([filter && 'p-0 border-none'])}>
			<div
				className={clsx([
					'flex justify-between items-center cursor-pointer',
					!filter && 'px-2',
				])}
				onClick={openHandler}
			>
				<h4
					className={clsx([
						filter
							? 'text-black label-xl !leading-[21px]'
							: 'label-lg uppercase',
					])}
				>
					{heading}
				</h4>
				<CollapseIcon
					className={cn(
						'transition-all duration-300',
						isOpen && 'rotate-180',
					)}
					size={20}
				/>
			</div>
			<div
				className={cn(
					'transition-[max-height,opacity] duration-300 overflow-hidden',
				)}
				style={{
					maxHeight: isOpen ? `${height}px` : '0px',
					opacity: isOpen ? 1 : 0,
					transition:
						'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out',
				}}
			>
				<div className={`${filter ? 'pt-6' : 'pt-4'}`} ref={contentRef}>
					{children}
				</div>
			</div>
		</Card>
	);
};
