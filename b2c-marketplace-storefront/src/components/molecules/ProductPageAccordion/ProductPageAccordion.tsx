'use client';

import { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/atoms';
import { MinusThinIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const ProductPageAccordion = ({
	children,
	heading,
	defaultOpen = true,
}: {
	children: React.ReactNode;
	heading: string;
	defaultOpen?: boolean;
}) => {
	const [open, setOpen] = useState(defaultOpen);
	const [contentHeight, setContentHeight] = useState(
		defaultOpen ? '100%' : 0,
	);

	const accordionRef = useRef(null);

	useEffect(() => {
		if (accordionRef.current)
			setContentHeight(accordionRef.current['scrollHeight'] || 0);
	}, []);

	const openHandler = () => {
		setOpen(!open);
	};
	return (
		<Card>
			<div
				className="flex justify-between items-center cursor-pointer px-2 py-4"
				onClick={openHandler}
			>
				<h4 className="label-lg uppercase">{heading}</h4>
				<div className="relative">
					<MinusThinIcon
						className={cn(
							'absolute top-0 left-0 transition-all duration-300',
							!open && 'rotate-90',
						)}
					/>
					<MinusThinIcon />
				</div>
			</div>
			<div
				className={cn(
					'transition-all duration-300 h-full overflow-hidden px-2',
				)}
				ref={accordionRef}
				style={{ maxHeight: open ? contentHeight : 0 }}
			>
				<div className="py-2">{children}</div>
			</div>
		</Card>
	);
};
