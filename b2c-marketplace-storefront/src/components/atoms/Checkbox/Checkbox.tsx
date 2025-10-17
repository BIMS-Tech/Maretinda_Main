"use client"

import { MinusHeavyIcon, TickThinIcon } from "@/icons"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean
  error?: boolean
  label?: string
  labelClassName?: string
}

export function Checkbox({
  label,
  labelClassName,
  indeterminate,
  error,
  className,
  checked,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={cn("flex items-center gap-2 cursor-pointer", labelClassName)}
    >
      <span
        className={cn(
          "checkbox-wrapper",
          checked && "!bg-action",
          error && "!border-negative",
          indeterminate && "!bg-action",
          props.disabled && "!bg-disabled !border-disabled !cursor-default",
          className
        )}
      >
        {indeterminate && !checked && !props.disabled && (
          <MinusHeavyIcon size={20} />
        )}
        {checked && !props.disabled && <TickThinIcon size={20} />}

        <input
          className={cn(
            "w-[20px] h-[20px] opacity-0 cursor-pointer",
            props.disabled && "cursor-default"
          )}
          type="checkbox"
          {...props}
        />
      </span>
      {label}
    </label>
  )
}
