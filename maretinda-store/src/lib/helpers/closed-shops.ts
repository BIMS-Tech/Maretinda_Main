/**
 * Adds the shops whose plan has ended to an Algolia filter. Their products
 * stay in the index, so listings and search leave them out by handle.
 */
export const withoutClosedShops = (filters: string, handles: string[]) =>
	[
		filters,
		...handles.map((h) => `NOT seller.handle:"${h.replace(/"/g, '')}"`),
	].join(' AND ');
