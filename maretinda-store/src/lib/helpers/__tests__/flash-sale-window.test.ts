import { describe, expect, it } from 'vitest';

import { isSaleLive, msUntilSaleEnds } from '../flash-sale-window';

const now = new Date('2026-11-10T12:00:00Z');
const sale = (starts: string, ends: string) => ({
	ends_at: ends,
	starts_at: starts,
});

describe('isSaleLive', () => {
	it('is live between its start and end', () => {
		expect(
			isSaleLive(
				sale('2026-11-10T11:00:00Z', '2026-11-10T13:00:00Z'),
				now,
			),
		).toBe(true);
	});

	it('is over once its end has passed, even if a cached copy says active', () => {
		expect(
			isSaleLive(
				sale('2026-11-10T10:00:00Z', '2026-11-10T11:59:59Z'),
				now,
			),
		).toBe(false);
	});

	it("hasn't started before its start", () => {
		expect(
			isSaleLive(
				sale('2026-11-10T12:00:01Z', '2026-11-10T13:00:00Z'),
				now,
			),
		).toBe(false);
	});

	it('treats a missing sale as not live', () => {
		expect(isSaleLive(null, now)).toBe(false);
	});
});

describe('msUntilSaleEnds', () => {
	it('counts down to the end', () => {
		expect(msUntilSaleEnds('2026-11-10T12:00:05Z', now)).toBe(5000);
	});

	it('never goes below zero', () => {
		expect(msUntilSaleEnds('2026-11-10T11:00:00Z', now)).toBe(0);
	});
});
