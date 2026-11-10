import { describe, expect, it } from 'vitest';

import { returnNote } from '../return-note';

const reasons = [
	{ id: 'rr_1', label: 'Wrong size' },
	{ id: 'rr_2', label: 'Damaged on arrival' },
];
const order = {
	items: [
		{ id: 'li_1', title: 'Barong' },
		{ id: 'li_2', title: 'Terno' },
	],
};

describe('returnNote', () => {
	it('names each item with the reason the buyer picked', () => {
		expect(
			returnNote(
				[
					{ line_item_id: 'li_1', reason_id: 'rr_1' },
					{ line_item_id: 'li_2', reason_id: 'rr_2' },
				],
				reasons,
				order,
			),
		).toBe('Barong: Wrong size; Terno: Damaged on arrival');
	});

	it('skips a reason it does not know', () => {
		expect(
			returnNote(
				[{ line_item_id: 'li_1', reason_id: 'rr_x' }],
				reasons,
				order,
			),
		).toBe('');
	});
});
