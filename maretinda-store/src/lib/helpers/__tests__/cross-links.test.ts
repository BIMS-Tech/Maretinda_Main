import { describe, expect, it } from 'vitest';

import { sellerRegisterUrl, socialLinks } from '../cross-links';

describe('sellerRegisterUrl', () => {
	// "Sell on Maretinda" in the header pointed at "#" whenever the build
	// didn't set NEXT_PUBLIC_seller_PANEL_URL, which production's doesn't.
	it('falls back to the production seller panel', () => {
		expect(sellerRegisterUrl(undefined)).toBe('https://seller.maretinda.com/register');
		expect(sellerRegisterUrl('')).toBe('https://seller.maretinda.com/register');
	});

	it('uses the configured panel, without doubling the slash', () => {
		expect(sellerRegisterUrl('https://testseller.maretinda.com/')).toBe('https://testseller.maretinda.com/register');
	});
});

describe('socialLinks', () => {
	it('lists only the networks with a URL, so no icon links to "#"', () => {
		expect(socialLinks({ facebook: 'https://facebook.com/maretinda', instagram: '', tiktok: undefined })).toEqual([
			{ label: 'Facebook', href: 'https://facebook.com/maretinda' },
		]);
	});
});
