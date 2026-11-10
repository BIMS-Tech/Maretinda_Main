type SaleWindow = { starts_at?: string | null; ends_at: string };

/**
 * Whether a flash sale is running at `now`. The active sale is cached for a
 * while, so an ended sale can still come back as "active"; its own dates
 * decide.
 */
export const isSaleLive = (
	sale: SaleWindow | null | undefined,
	now = new Date(),
) =>
	!!sale &&
	(!sale.starts_at || new Date(sale.starts_at) <= now) &&
	new Date(sale.ends_at) > now;

export const msUntilSaleEnds = (endsAt: string, now = new Date()) =>
	Math.max(0, new Date(endsAt).getTime() - now.getTime());
