'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface IndicatorProps {
	size?: 'small' | 'medium' | 'large';
	step: number;
	maxStep: number;
	className?: string;
	variant?: 'light' | 'dark';
}

export function Indicator({
	variant = 'light',
	size = 'medium',
	step,
	maxStep,
	className,
}: IndicatorProps) {
	const [wrapperWidth, setWrapperWidth] = useState(0);

	const wrapperRef = useRef<HTMLInputElement | null>(null);

	const baseClasses = {
		dark: 'rounded-md bg-primary/10 relative',
		light: 'rounded-md bg-tertiary/10 relative',
	};
	const sizeClasses = {
		large: 'w-full h-1',
		medium: 'w-full h-1',
		small: 'w-full h-1',
	};

	useEffect(() => {
		window.addEventListener('resize', () => {
			setWrapperWidth(
				wrapperRef.current ? wrapperRef.current.offsetWidth : 0,
			);
		});

		return () => window.removeEventListener('resize', () => null);
	}, []);

	useEffect(() => {
		setWrapperWidth(
			wrapperRef.current ? wrapperRef.current.offsetWidth : 0,
		);
	}, [wrapperRef]);

	return (
		<div
			className={cn(baseClasses[variant], sizeClasses[size], className)}
			ref={wrapperRef}
		>
			<div
				className={cn(
					'h-full rounded-sm absolute transition-all duration-300',
					variant === 'light' ? 'bg-tertiary' : 'bg-white',
				)}
				style={{
					left: (wrapperWidth / maxStep) * (step - 1) || 0,
					width: wrapperWidth / maxStep || 0,
				}}
			/>
		</div>
	);
}
