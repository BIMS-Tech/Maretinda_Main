import { describe, expect, it } from 'vitest';

import { sessionCookieOptions } from '../session-cookie';

describe('sessionCookieOptions', () => {
	it('is sent when a buyer comes back from GiyaPay (lax, not strict)', () => {
		// Strict withholds the cookie on the redirect back from giyapay.com, so
		// the page renders signed out until a refresh
		expect(sessionCookieOptions(7).sameSite).toBe('lax');
	});

	it('stays out of reach of scripts and lasts the given days', () => {
		expect(sessionCookieOptions(7)).toMatchObject({
			httpOnly: true,
			maxAge: 7 * 24 * 60 * 60,
			path: '/',
		});
	});
});
