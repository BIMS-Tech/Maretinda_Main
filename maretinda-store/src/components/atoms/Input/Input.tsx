'use client';

import { ChevronDown, EyeMini, EyeSlashMini } from '@medusajs/icons';
import { DropdownMenu, IconButton } from '@medusajs/ui';
import React, { useEffect, useState } from 'react';

import { CloseIcon } from '@/icons';
import { cn } from '@/lib/utils';

type Option = {
	label: string;
	value: string;
};
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	icon?: React.ReactNode;
	isDropdownCategory?: boolean;
	clearable?: boolean;
	error?: boolean;
	changeValue?: (value: string) => void;
	options?: Option[];
}

export function Input({
	label,
	icon,
	isDropdownCategory,
	clearable,
	className,
	error,
	changeValue,
	options,
	onChange,
	...props
}: InputProps) {
	const [showPassword, setShowPassword] = useState(false);
	const [inputType, setInputType] = useState(props.type);
	let paddingY = '';
	if (icon) paddingY += 'pl-[46px] ';
	if (clearable) paddingY += 'pr-[38px]';
	if (isDropdownCategory) paddingY += 'pr-[155px]';

	useEffect(() => {
		if (props.type === 'password' && showPassword) {
			setInputType('text');
		}

		if (props.type === 'password' && !showPassword) {
			setInputType('password');
		}
	}, [props.type, showPassword]);

	const changeHandler = (value: string) => {
		if (changeValue) changeValue(value);
	};

	const clearHandler = () => {
		if (changeValue) changeValue('');
	};

	const initialDefaultValue =
		options && options.length > 0 ? options[0].value : '';
	const [dropdownValue, setDropdownValue] =
		React.useState(initialDefaultValue);

	return (
		<label className="label-md w-full">
			{label}
			<div className={`relative ${!isDropdownCategory && 'mt-2'}`}>
				{icon && (
					<span className="absolute top-0 left-[16px] h-full flex items-center">
						{icon}
					</span>
				)}

				<input
					className={cn(
						'w-full px-[16px] py-[12px] border rounded-sm bg-component-secondary focus:border-primary focus:outline-none focus:ring-0',
						error && 'border-negative focus:border-negative',
						props.disabled && 'bg-disabled cursor-not-allowed',
						paddingY,
						className,
					)}
					onChange={(e) => {
						if (changeValue) {
							changeHandler(e.target.value);
						}
						if (onChange) {
							onChange(e);
						}
					}}
					value={props.value}
					{...props}
					type={inputType}
				/>
				{clearable && props.value && (
					<span
						className="absolute h-full flex items-center top-0 right-[16px] cursor-pointer"
						onClick={clearHandler}
					>
						<CloseIcon />
					</span>
				)}
				{props.type === 'password' && (
					<button
						className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-4"
						onClick={() => setShowPassword(!showPassword)}
						type="button"
					>
						{showPassword ? <EyeMini /> : <EyeSlashMini />}
					</button>
				)}
				{isDropdownCategory && options && (
					<div className="lg:min-w-[130px] h-[48px] absolute right-4 top-0 flex items-center justify-end">
						<div className="flex flex-col items-center gap-y-2">
							<DropdownMenu>
								<DropdownMenu.Trigger asChild>
									<div className="flex items-center text-md !font-medium text-[#999] gap-1.5">
										{dropdownValue}
										<IconButton
											className="shadow-none"
											size="small"
										>
											<ChevronDown />
										</IconButton>
									</div>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content
									align="end"
									className="bg-white w-[175px] -mr-4 mt-2 z-50 py-3 px-0 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)]"
								>
									<DropdownMenu.RadioGroup
										onValueChange={setDropdownValue}
										value={dropdownValue}
									>
										{options.map((option) => (
											<DropdownMenu.RadioItem
												className="search px-3.5 py-1.5 text-primary font-medium text-base data-[state=checked]:bg-[#EA71FF] rounded-none"
												key={option.value}
												value={option.value}
											>
												{option.label}
											</DropdownMenu.RadioItem>
										))}
									</DropdownMenu.RadioGroup>
								</DropdownMenu.Content>
							</DropdownMenu>
						</div>
					</div>
				)}
			</div>
		</label>
	);
}
