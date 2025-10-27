'use client';

import { CheckCircle } from '@medusajs/icons';
import { useEffect, useState } from 'react';

import { Card } from '@/components/atoms';
import { cn } from '@/lib/utils';

export function validatePassword(password: string) {
	const errors = {
		noDigitOrSymbol: !/[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`]/.test(
			password,
		),
		noLower: !/[a-z]/.test(password),
		noUpper: !/[A-Z]/.test(password),
		tooShort: password.length < 8,
	};

	return {
		errors,
		isValid: !Object.values(errors).some(Boolean),
	};
}

export const PasswordValidator = ({
	password,
	setError,
}: {
	password: string;
	setError: (error: any) => void;
}) => {
	const [newPasswordError, setNewPasswordError] = useState({
		'8chars': false,
		isValid: false,
		lower: false,
		symbolOrDigit: false,
		upper: false,
	});

	useEffect(() => {
		const validation = validatePassword(password);

		setError({
			'8chars': validation.errors.tooShort,
			isValid: validation.isValid,
			lower: validation.errors.noLower,
			symbolOrDigit: validation.errors.noDigitOrSymbol,
			upper: validation.errors.noUpper,
		});
		setNewPasswordError({
			'8chars': validation.errors.tooShort,
			isValid: validation.isValid,
			lower: validation.errors.noLower,
			symbolOrDigit: validation.errors.noDigitOrSymbol,
			upper: validation.errors.noUpper,
		});
	}, [password]);
	return (
		<Card className="p-4">
			<p
				className={cn(
					'label-md flex items-center gap-2 mb-2',
					newPasswordError['8chars']
						? 'text-red-700'
						: 'text-green-700',
				)}
			>
				<CheckCircle /> At least 8 characters
			</p>
			<p
				className={cn(
					'label-md flex items-center gap-2 mb-2',
					newPasswordError['lower']
						? 'text-red-700'
						: 'text-green-700',
				)}
			>
				<CheckCircle /> One lowercase letter
			</p>
			<p
				className={cn(
					'label-md flex items-center gap-2 mb-2',
					newPasswordError['upper']
						? 'text-red-700'
						: 'text-green-700',
				)}
			>
				<CheckCircle /> One uppercase letter
			</p>
			<p
				className={cn(
					'label-md flex items-center gap-2 mb-2',
					newPasswordError['symbolOrDigit']
						? 'text-red-700'
						: 'text-green-700',
				)}
			>
				<CheckCircle /> One number or symbol
			</p>
		</Card>
	);
};
