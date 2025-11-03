"use client"

import { MinusHeavyIcon, TickThinIcon } from "@/icons";
import { cn } from "@/lib/utils";

import style from "./checkbox.module.css";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
	indeterminate?: boolean;
	error?: boolean;
	label?: string;
	labelClassName?: string;
	filter?: boolean;
}

export function Checkbox({
	label,
	labelClassName,
	indeterminate,
	error,
	className,
	checked,
	filter = false,
	...props
}: CheckboxProps) {
	return (
		<label
			className={cn(
				"flex items-center justify-center gap-2 cursor-pointer w-5 h-5",
				labelClassName,
			)}
		>
			<span
				className={cn(
					"checkbox-wrapper",
					filter && style.checkBoxUnchecked,
					checked && !filter && "!bg-action",
					checked && filter && `!bg-[#2563EB] ${style.checkBoxChecked}`,
					error && "!border-negative",
					indeterminate && "!bg-action",
					props.disabled && "!bg-disabled !border-disabled !cursor-default",
					className,
				)}
			>
				{indeterminate && !checked && !props.disabled && (
					<MinusHeavyIcon size={20} />
				)}
				{checked && !props.disabled && (
					<TickThinIcon className={style.checkIcon} size={20} />
				)}

				<input
					className={cn(
						"w-[20px] h-[20px] opacity-0 cursor-pointer",
						props.disabled && "cursor-default",
					)}
					type="checkbox"
					{...props}
				/>
			</span>
			{label}
		</label>
	);
}
