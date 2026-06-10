export const ProductFreeDeliveryDetails = () => {
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
					<rect x="1" y="3" width="15" height="13" rx="1" />
					<path d="M16 8h4l3 5v4h-7V8z" />
					<circle cx="5.5" cy="18.5" r="2.5" />
					<circle cx="18.5" cy="18.5" r="2.5" />
				</svg>
			</div>
			<div>
				<p className="text-[13.5px] font-semibold text-gray-800">
					Free Delivery
				</p>
				<p className="text-[12.5px] text-gray-500 mt-0.5 leading-relaxed">
					Free standard shipping on all orders. Ships within 3–5
					business days.
				</p>
			</div>
		</div>
	);
};
