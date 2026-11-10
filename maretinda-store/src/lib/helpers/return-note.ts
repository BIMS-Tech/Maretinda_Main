type SelectedItem = { line_item_id: string; reason_id?: string };
type Reason = { id: string; label: string };
type Order = { items?: { id: string; title?: string | null }[] | null };

/**
 * The reasons a buyer picked, as one readable note. The seller and admin
 * screens show the request's note as its reason; without it they were blank.
 */
export const returnNote = (
	selected: SelectedItem[],
	reasons: Reason[],
	order: Order,
) =>
	selected
		.map((item) => {
			const reason = reasons.find((r) => r.id === item.reason_id)?.label;
			if (!reason) return null;
			const title = order.items?.find(
				(i) => i.id === item.line_item_id,
			)?.title;
			return title ? `${title}: ${reason}` : reason;
		})
		.filter(Boolean)
		.join('; ');
