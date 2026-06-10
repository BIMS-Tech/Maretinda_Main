export const ProductFreeDeliveryDetails = () => {
	return (
		<div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-black/[0.07] bg-[#FDFCFE]">
			<span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F2ECF8] flex items-center justify-center mt-0.5">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
				</svg>
			</span>
			<div>
				<p className="text-[12.5px] font-semibold text-[#1B1B1B] mb-0.5">Free Delivery</p>
				<p className="text-[11.5px] text-gray-400 leading-relaxed">
					Free standard shipping on all orders. Ships within 3–5 business days.
				</p>
			</div>
		</div>
	);
};
