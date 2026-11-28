import { describe, expect, it } from 'vitest';

import { verifyEmailView } from '../verify-email-view';

const confirmed = {
	email: 'ana@example.com',
	kind: 'customer' as const,
	ok: true,
};

describe('verifyEmailView', () => {
	it('lets the buyer order when this browser is signed in to the confirmed account', () => {
		expect(verifyEmailView(confirmed, 'ana@example.com')).toBe('ready');
		expect(verifyEmailView(confirmed, 'Ana@Example.com')).toBe('ready');
	});

	it('asks to sign in when the link is opened in a browser with no session', () => {
		expect(verifyEmailView(confirmed, null)).toBe('sign-in');
	});

	it('says so when this browser is signed in to someone else', () => {
		expect(verifyEmailView(confirmed, 'ben@example.com')).toBe(
			'other-account',
		);
	});

	it('treats a seller application on its own', () => {
		expect(
			verifyEmailView({ ...confirmed, kind: 'seller_application' }, null),
		).toBe('seller');
	});

	it('reports a link that did not work', () => {
		expect(verifyEmailView({ ok: false }, 'ana@example.com')).toBe(
			'failed',
		);
	});
});
