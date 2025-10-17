"use client"

import type { FieldError } from "react-hook-form"

import { Input } from "@/components/atoms"
import { cn } from "@/lib/utils"

type LabeledInputProps = {
  inputClassName?: string
  important?: boolean
  label: string
  labelClassName?: string
  error?: FieldError
} & React.InputHTMLAttributes<HTMLInputElement>

export const LabeledInput = ({
  error,
  className,
  inputClassName,
  important = false,
  label,
  labelClassName,
  ...props
}: LabeledInputProps) => (
  <label className={cn("label-sm block", className)}>
    <p className={cn(error && "text-negative", labelClassName)}>
      {label}
      {important && <span className="text-red-500/50">*</span>}
    </p>
    <Input
      className={cn(error && "border-negative", inputClassName)}
      {...props}
    />
    {error && <p className="label-sm text-negative">{error.message}</p>}
  </label>
)
