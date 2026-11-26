import { describe, expect, it } from 'vitest';

import { isShopperToken, tokenPayload } from '../session-token';

const token = (payload: unknown) =>
	`h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

describe('isShopperToken', () => {
	it('accepts a shopper', () => {
		expect(isShopperToken(token({ actor_id: 'cus_1', actor_type: 'customer' }))).toBe(true);
	});

	it("refuses a seller's password accepted on the shopper sign-in: no shopper behind it", () => {
		expect(isShopperToken(token({ actor_id: '', actor_type: 'customer', auth_identity_id: 'authid_1' }))).toBe(false);
	});

	it('refuses tokens for other kinds of account', () => {
		expect(isShopperToken(token({ actor_id: 'mem_1', actor_type: 'seller' }))).toBe(false);
		expect(isShopperToken(token({ actor_id: 'user_1', actor_type: 'user' }))).toBe(false);
	});

	it('refuses anything that is not a token', () => {
		for (const bad of [undefined, null, '', 'abc', 'a.b.c', token(null), token('x'), token([])]) {
			expect(isShopperToken(bad)).toBe(false);
		}
	});
});

describe('tokenPayload', () => {
	it('reads the payload and shrugs at rubbish', () => {
		expect(tokenPayload(token({ a: 1 }))).toEqual({ a: 1 });
		expect(tokenPayload('nope')).toEqual({});
	});
});
