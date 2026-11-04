import { afterEach, describe, expect, it, vi } from 'vitest';

// share.ts reads NEXT_PUBLIC_FACEBOOK_APP_ID at import time, so each case
// loads a fresh copy of the module after setting the env.
const load = async (facebookAppId?: string) => {
	vi.resetModules();
	vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', facebookAppId ?? '');
	return import('../share');
};

const content = {
	image: 'https://cdn.maretinda.com/p/barong.jpg',
	price: '₱1,499.00',
	title: 'Barong & Co. Linen',
	url: 'https://maretinda.com/products/barong?variant=red',
};

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe('buildShareTargets', () => {
	it('hides Messenger until a Facebook app id is configured', async () => {
		const { buildShareTargets } = await load();
		expect(buildShareTargets(content).map((t) => t.id)).toEqual([
			'facebook',
			'x',
			'whatsapp',
			'viber',
			'telegram',
			'linkedin',
			'pinterest',
			'email',
		]);
	});

	it('offers Messenger right after Facebook once the app id is set', async () => {
		const { buildShareTargets } = await load('1234567890');
		const targets = buildShareTargets(content);
		expect(targets.map((t) => t.id).slice(0, 2)).toEqual(['facebook', 'messenger']);
		expect(targets[1].href).toContain('app_id=1234567890');
	});

	it('URL-encodes the link and caption so & and ? survive', async () => {
		const { buildShareTargets } = await load();
		const x = buildShareTargets(content).find((t) => t.id === 'x')!;
		const params = new URL(x.href).searchParams;
		expect(params.get('url')).toBe(content.url);
		expect(params.get('text')).toBe('Barong & Co. Linen - ₱1,499.00');
	});

	it('leaves the caption off Facebook and LinkedIn, which read Open Graph tags', async () => {
		const { buildShareTargets } = await load();
		const targets = buildShareTargets(content);
		for (const id of ['facebook', 'linkedin']) {
			expect(targets.find((t) => t.id === id)!.href).not.toContain('Barong');
		}
	});

	it('puts the link inside the message for WhatsApp and Viber', async () => {
		const { buildShareTargets } = await load();
		const targets = buildShareTargets(content);
		const whatsapp = new URL(targets.find((t) => t.id === 'whatsapp')!.href);
		expect(whatsapp.searchParams.get('text')).toBe(
			`Barong & Co. Linen - ₱1,499.00 ${content.url}`,
		);
		const viber = targets.find((t) => t.id === 'viber')!;
		expect(viber.appOnly).toBe(true);
		expect(viber.href.startsWith('viber://forward?text=')).toBe(true);
	});

	it('attaches the product photo to Pinterest only when there is one', async () => {
		const { buildShareTargets } = await load();
		const withImage = buildShareTargets(content).find((t) => t.id === 'pinterest')!;
		expect(new URL(withImage.href).searchParams.get('media')).toBe(content.image);
		const without = buildShareTargets({ ...content, image: undefined }).find(
			(t) => t.id === 'pinterest',
		)!;
		expect(without.href).not.toContain('media=');
	});

	it('uses just the title when there is no price', async () => {
		const { buildShareTargets } = await load();
		const email = buildShareTargets({ ...content, price: undefined }).find(
			(t) => t.id === 'email',
		)!;
		expect(email.href).toContain(`subject=${encodeURIComponent('Barong & Co. Linen')}&`);
	});
});

describe('buildShareUrl', () => {
	it('returns an empty string during server rendering', async () => {
		const { buildShareUrl } = await load();
		expect(buildShareUrl({ size: 'M' })).toBe('');
	});

	it('drops tracking params and keeps the selected variant', async () => {
		vi.stubGlobal('window', {
			location: {
				origin: 'https://maretinda.com',
				pathname: '/products/barong',
				search: '?utm_source=fb&fbclid=abc',
			},
		});
		const { buildShareUrl } = await load();
		expect(buildShareUrl({ color: 'red', size: '' })).toBe(
			'https://maretinda.com/products/barong?color=red',
		);
	});
});
