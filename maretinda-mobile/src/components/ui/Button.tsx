import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  title,
  loading,
  variant = 'primary',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'rounded-xl items-center justify-center flex-row gap-2';

  const sizeClass = {
    sm: 'px-4 py-2',
    md: 'px-5 py-3.5',
    lg: 'px-6 py-4',
  }[size];

  const variantClass = {
    primary: 'bg-primary',
    outline: 'border border-primary bg-transparent',
    ghost: 'bg-transparent',
  }[variant];

  const textVariantClass = {
    primary: 'text-white font-semibold',
    outline: 'text-primary font-semibold',
    ghost: 'text-primary',
  }[variant];

  const textSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`${base} ${sizeClass} ${variantClass} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#5B1072'} />}
      <Text className={`${textVariantClass} ${textSizeClass}`}>{title}</Text>
    </Pressable>
  );
}
