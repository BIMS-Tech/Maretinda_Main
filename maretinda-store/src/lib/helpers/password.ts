/**
 * The one set of rules for a password: what the checklist shows is what the
 * form accepts, when signing up, resetting and changing it.
 */
export function validatePassword(password: string) {
	const errors = {
		noDigitOrSymbol: !/[^\p{L}\s]/u.test(password),
		noLower: !/\p{Ll}/u.test(password),
		noUpper: !/\p{Lu}/u.test(password),
		tooShort: password.length < 8,
	};
	return { errors, isValid: !Object.values(errors).some(Boolean) };
}

export const PASSWORD_RULE = 'Use at least 8 characters, with an uppercase letter, a lowercase letter, and a number or symbol.';
