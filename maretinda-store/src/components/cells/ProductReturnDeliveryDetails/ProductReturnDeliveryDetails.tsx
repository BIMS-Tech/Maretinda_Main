export const ProductReturnDeliveryDetails = () => {
	return (
		<div className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl border border-black/[0.07] bg-white">
			<div className="mt-0.5 shrink-0 text-[#432C63]">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<polyline points="1 4 1 10 7 10" />
					<path d="M3.51 15a9 9 0 1 0 .49-4.89" />
				</svg>
			</div>
			<div>
				<p className="text-[13.5px] font-semibold text-gray-800">
					30-Day Returns
				</p>
				<p className="text-[12.5px] text-gray-500 mt-0.5 leading-relaxed">
					Not satisfied? Return in original condition for a full
					refund or exchange.
				</p>
			</div>
		</div>
	);
};
