import { describe, expect, it } from 'vitest';

import { loginPath } from '../safe-return-to';

describe('loginPath', () => {
	it('keeps where the shopper was going', () => {
		expect(loginPath('/checkout?step=address')).toBe('/login?returnTo=%2Fcheckout%3Fstep%3Daddress');
	});

	it('drops a return address off this site', () => {
		expect(loginPath('https://evil.example')).toBe('/login');
		expect(loginPath('//evil.example')).toBe('/login');
	});

	it('is plain /login with nowhere to return to', () => {
		expect(loginPath(undefined)).toBe('/login');
	});
});
