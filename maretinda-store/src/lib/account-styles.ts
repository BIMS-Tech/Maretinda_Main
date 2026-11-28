/**
 * The account pages' look, from the Dashboard: white cards on a lavender
 * tint, the brand purple #432C63 (hover #372248) for actions and headings,
 * #EAE5F0 borders and cream #FAF8F5 panels. Yellow is kept for selling.
 */
export const account = {
	card: 'overflow-hidden rounded-2xl border border-[#EAE5F0] bg-white shadow-[0_4px_24px_rgba(67,44,99,0.06)]',
	cardHead: 'border-b border-[#EAE5F0] bg-[#F6F2FB] px-5 py-4 sm:px-6',
	eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[#432C63]/60',
	title: 'text-[16px] font-semibold text-[#432C63]',
	panel: 'rounded-xl border border-[#EAE5F0] bg-[#FAF8F5] p-4 sm:p-5',
	panelTitle: 'text-[15px] font-semibold text-[#1B1B1B]',
	panelText: 'mt-1 max-w-md text-[13px] leading-relaxed text-black/60',
	primaryButton:
		'inline-flex items-center justify-center gap-1.5 rounded-full bg-[#432C63] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#372248] disabled:opacity-60',
	outlineButton:
		'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#432C63]/25 bg-white px-4 py-2 text-[13px] font-medium text-[#432C63] transition-colors hover:bg-[#F6F2FB] disabled:opacity-60',
};

/** A parcel's progress as a soft pill, in the same colours as the order tracker. */
export const STATUS_TONE: Record<string, string> = {
	Cancelled: 'bg-black/[0.05] text-black/60',
	Delivered: 'bg-[#E7F5EC] text-[#1F7A4D]',
	Preparing: 'bg-[#F6F2FB] text-[#432C63]',
	Received: 'bg-[#F6F2FB] text-[#432C63]',
	Shipped: 'bg-[#FFF4D6] text-[#7A5B00]',
};
