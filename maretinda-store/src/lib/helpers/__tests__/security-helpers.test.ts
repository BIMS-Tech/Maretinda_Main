import { describe, expect, it } from 'vitest';

import { safeReturnTo } from '../safe-return-to';
import { sanitizeSellerHtml } from '../sanitize-html';

describe('safeReturnTo', () => {
	it.each(['/user', '/checkout', '/campaigns/abc', '/products/x?size=M#reviews'])(
		'follows the on-site path %s',
		(path) => {
			expect(safeReturnTo(path, '/user')).toBe(path);
		},
	);

	it.each([
		'https://evil.example',
		'//evil.example',
		'/\\evil.example',
		'javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'/\t/evil.example',
		'/\n/evil.example',
		'evil.example',
		'',
	])('refuses %j', (path) => {
		expect(safeReturnTo(path, '/user')).toBe('/user');
	});

	it('falls back when there is no returnTo', () => {
		expect(safeReturnTo(null, '/login')).toBe('/login');
		expect(safeReturnTo(undefined, '/login')).toBe('/login');
	});
});

describe('sanitizeSellerHtml', () => {
	it.each([
		['script tags', '<script>alert(1)</script>'],
		['event handlers', '<img src="https://x/a.png" onerror="alert(1)">'],
		['javascript: links', '<a href="javascript:alert(1)">x</a>'],
		['iframes', '<iframe src="https://evil.example"></iframe>'],
		['svg payloads', '<svg onload="alert(1)"></svg>'],
		['style injection', '<style>body{display:none}</style>'],
		['forms that phish', '<form action="https://evil.example"><input name="password"></form>'],
		['data: images', '<img src="data:text/html;base64,PHNjcmlwdD4=">'],
		['mixed-case tricks', '<ScRiPt>alert(1)</sCrIpT>'],
		['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
	])('strips %s', (_label, html) => {
		const clean = sanitizeSellerHtml(html);
		expect(clean).not.toMatch(
			/<script|onerror|onload|javascript:|<iframe|<svg|<style|<form|<input|data:text|<meta/i,
		);
	});

	it('keeps the formatting a rich-text editor produces', () => {
		const html =
			'<h2>Linen</h2><p>Soft <strong>and</strong> <em>light</em></p><ul><li>Handmade</li></ul>';
		expect(sanitizeSellerHtml(html)).toBe(html);
	});

	it('keeps real links and images, and hardens links', () => {
		const clean = sanitizeSellerHtml(
			'<a href="https://maretinda.com/x">x</a><img src="https://cdn.example/a.png" alt="a">',
		);
		expect(clean).toContain('href="https://maretinda.com/x"');
		expect(clean).toContain('rel="noopener noreferrer nofollow"');
		expect(clean).toContain('src="https://cdn.example/a.png"');
	});

	it('handles empty descriptions', () => {
		expect(sanitizeSellerHtml(null)).toBe('');
		expect(sanitizeSellerHtml(undefined)).toBe('');
	});
});
