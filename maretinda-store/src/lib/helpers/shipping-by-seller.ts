type ItemWithSeller = {
	product?: { seller?: { id?: string; name?: string } | null } | null;
};
type Option = { id: string };
type ShippingMethod = { id: string; shipping_option_id?: string | null };

/** Shop names by seller id, from the cart's items, to label each delivery picker. */
export const sellerNamesById = (items: ItemWithSeller[] = []) =>
	Object.fromEntries(
		items
			.map((item) => item.product?.seller)
			.filter(
				(seller): seller is { id: string; name: string } =>
					!!seller?.id && !!seller?.name,
			)
			.map((seller) => [seller.id, seller.name]),
	) as Record<string, string>;

/**
 * The cart's shipping method chosen from one seller's options. A cart with
 * two sellers has two methods, so a picker can't just read the first.
 */
export const chosenMethodFor = <T extends ShippingMethod>(
	sellerOptions: Option[],
	methods: T[] = [],
) =>
	methods.find((m) =>
		sellerOptions.some((o) => o.id === m.shipping_option_id),
	);
