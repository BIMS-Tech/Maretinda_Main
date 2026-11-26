'use client';

import { type InputHTMLAttributes, type ReactNode, type Ref, useState } from 'react';

import { HideIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const AUTH_INPUT =
	'border bg-[#FBFAFC] rounded-xl h-12 px-4 w-full text-[14px] transition-[border-color,box-shadow,background-color] duration-300 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:bg-white focus:border-[#432C63] focus:ring-4 focus:ring-[#432C63]/10';

const EyeIcon = () => (
	<svg aria-hidden="true" fill="none" height={18} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" width={18}>
		<path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.510 7.360 4.500 12 4.500c4.638 0 8.573 3.007 9.963 7.178.070.207.070.431 0 .639C20.577 16.490 16.640 19.500 12 19.500c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export function PasswordField({ error, aside, label, ref, ...props }: { error?: string; aside?: ReactNode; label: string; ref?: Ref<HTMLInputElement> } & InputHTMLAttributes<HTMLInputElement>) {
	const [shown, setShown] = useState(false);
	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between">
				<label className="text-[13px] font-semibold text-[#1B1B1B]" htmlFor={`field-${props.name}`}>
					{label} <span className="text-red-400">*</span>
				</label>
				{aside}
			</div>
			<div className="relative">
				<input
					{...props}
					aria-invalid={!!error}
					className={cn(AUTH_INPUT, 'pr-11', error ? 'border-red-400' : 'border-[#EAE5F0]')}
					id={`field-${props.name}`}
					ref={ref}
					type={shown ? 'text' : 'password'}
				/>
				<button
					aria-label={shown ? 'Hide password' : 'Show password'}
					className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] transition-colors hover:text-[#432C63]"
					onClick={() => setShown((v) => !v)}
					type="button"
				>
					{shown ? <HideIcon color="#9B9B9B" size={18} /> : <EyeIcon />}
				</button>
			</div>
			{error && <p className="mt-0.5 text-[11.5px] text-red-500">{error}</p>}
		</div>
	);
}
