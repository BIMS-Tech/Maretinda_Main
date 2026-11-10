import { describe, expect, it } from 'vitest';

import { isDeletionConfirmed } from '../account-deletion';

describe('isDeletionConfirmed', () => {
	it.each(['DELETE', 'delete', '  Delete '])('accepts "%s"', (input) => {
		expect(isDeletionConfirmed(input)).toBe(true);
	});

	it.each(['', 'DEL', 'delete account', 'yes'])('refuses "%s"', (input) => {
		expect(isDeletionConfirmed(input)).toBe(false);
	});
});
