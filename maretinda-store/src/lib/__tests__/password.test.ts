import { describe, expect, it } from 'vitest';

import { registerFormSchema } from '@/components/molecules/RegisterForm/schema';
import { validatePassword } from '@/lib/helpers/password';

const signUp = (password: string) =>
	registerFormSchema.safeParse({ countryCode: '+63', email: 'a@b.co', firstName: 'A', lastName: 'B', password, phone: '9171234567', terms: true }).success;

describe('password rules', () => {
	it.each(['Wish-pass-1', 'Maretinda1', 'Sari Sari_Store', 'Ñandú-99x', 'Abcdefg!'])('the sign-up form accepts %s, as its checklist does', (password) => {
		expect(validatePassword(password).isValid).toBe(true);
		expect(signUp(password)).toBe(true);
	});

	it.each(['Short1!', 'alllower1!', 'ALLUPPER1!', 'NoDigitsHere'])('both refuse %s', (password) => {
		expect(validatePassword(password).isValid).toBe(false);
		expect(signUp(password)).toBe(false);
	});
});
