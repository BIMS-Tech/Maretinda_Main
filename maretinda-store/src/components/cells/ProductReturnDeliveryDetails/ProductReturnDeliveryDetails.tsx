export const ProductReturnDeliveryDetails = () => {
	return (
		<div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-black/[0.07] bg-[#FDFCFE]">
			<span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F2ECF8] flex items-center justify-center mt-0.5">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
				</svg>
			</span>
			<div>
				<p className="text-[12.5px] font-semibold text-[#1B1B1B] mb-0.5">30-Day Returns</p>
				<p className="text-[11.5px] text-gray-400 leading-relaxed">
					Not satisfied? Return in original condition for a full refund or exchange.
				</p>
			</div>
		</div>
	);
};
