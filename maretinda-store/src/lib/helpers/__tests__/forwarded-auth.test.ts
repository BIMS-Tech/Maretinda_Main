import { describe, expect, it } from 'vitest';

import { forwardedAuthHeaders } from '../forwarded-auth';

describe('forwardedAuthHeaders', () => {
	// The store signs buyers in from its own server, so the backend saw one
	// address for everyone and its per-address sign-up limit applied store-wide
	it("passes on the buyer's address with the shared secret", () => {
		const incoming = new Headers({ 'cf-connecting-ip': '198.51.100.7', 'x-forwarded-for': '10.0.0.9' });
		expect(forwardedAuthHeaders(incoming, 's3cret-value-1234')).toEqual({
			'x-maretinda-client-ip': '198.51.100.7',
			'x-maretinda-store-secret': 's3cret-value-1234',
		});
	});

	it('falls back to the first X-Forwarded-For address off Cloudflare', () => {
		const incoming = new Headers({ 'x-forwarded-for': '198.51.100.8, 10.0.0.1' });
		expect(forwardedAuthHeaders(incoming, 's3cret-value-1234')['x-maretinda-client-ip']).toBe('198.51.100.8');
	});

	it('sends nothing without a secret or an address', () => {
		expect(forwardedAuthHeaders(new Headers({ 'cf-connecting-ip': '198.51.100.7' }), undefined)).toEqual({});
		expect(forwardedAuthHeaders(new Headers(), 's3cret-value-1234')).toEqual({});
	});
});
