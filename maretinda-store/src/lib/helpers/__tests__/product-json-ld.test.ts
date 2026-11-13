import { describe, expect, it } from 'vitest';

import { jsonLdScript, productJsonLd } from '../product-json-ld';

const variant = (amount: number, stock = 5) => ({
	calculated_price: { calculated_amount: amount, currency_code: 'php' },
	inventory_quantity: stock,
	manage_inventory: true,
});

const opts = { sellerName: 'QA Shop A', url: 'https://maretinda.com/ph/products/barong' };

describe('productJsonLd', () => {
	it('states the cheapest price in pesos and that it is in stock', () => {
		const ld = productJsonLd(
			{ thumbnail: 'https://cdn/a.jpg', images: [{ url: 'https://cdn/a.jpg' }, { url: 'https://cdn/b.jpg' }], title: 'Barong', variants: [variant(900), variant(500, 0)] },
			opts,
		) as any;
		expect(ld.offers).toMatchObject({
			availability: 'https://schema.org/InStock',
			price: 500,
			priceCurrency: 'PHP',
			seller: { name: 'QA Shop A' },
		});
		expect(ld.image).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg']);
	});

	it('says out of stock when every variant is empty', () => {
		const ld = productJsonLd({ title: 'Barong', variants: [variant(900, 0)] }, opts) as any;
		expect(ld.offers.availability).toBe('https://schema.org/OutOfStock');
	});

	it('includes a rating only when there are reviews', () => {
		const product = { title: 'Barong', variants: [variant(900)] };
		expect((productJsonLd(product, opts) as any).aggregateRating).toBeUndefined();
		expect((productJsonLd(product, { ...opts, rating: { average: 4.26, count: 3 } }) as any).aggregateRating).toMatchObject({ ratingValue: 4.3, reviewCount: 3 });
	});

	it('is left out for a product with no price', () => {
		expect(productJsonLd({ title: 'Barong', variants: [{}] }, opts)).toBeNull();
	});

	it('cannot close the script tag it sits in', () => {
		expect(jsonLdScript({ name: '</script><script>alert(1)' })).not.toContain('</script>');
	});
});
