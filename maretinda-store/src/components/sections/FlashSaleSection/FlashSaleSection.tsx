import Link from 'next/link';

import { SectionHeading } from '@/components/motion';
import { FlashSaleGrid } from '@/components/organisms/FlashSaleGrid/FlashSaleGrid';
import { getActiveFlashSale } from '@/lib/data/flash-sales';
import { FlashSaleCountdown } from './FlashSaleCountdown';

export const FlashSaleSection = async () => {
	const sale = await getActiveFlashSale();
	if (!sale || !sale.items?.length) return null;

	return (
		<section style={{ backgroundColor: '#FAF8F5', borderTop: '1px solid #EDEAE3', borderBottom: '1px solid #EDEAE3' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-12">

				{/* Section header */}
				<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-6 mb-7">
					<div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
						<div>
							<div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] uppercase text-red-600">
								<span className="relative flex w-2 h-2">
									<span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75" />
									<span className="relative inline-block w-2 h-2 rounded-full bg-red-600" />
								</span>
								Happening now
							</div>
							<Link className="mt-2 flex items-center gap-2.5" href="/flash-sale">
								<svg aria-hidden="true" className="pop-in h-6 w-6 shrink-0 sm:h-[26px] sm:w-[26px]" fill="#FFC533" stroke="none" viewBox="0 0 24 24">
									<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
								</svg>
								<SectionHeading className="font-serif text-[clamp(26px,6vw,42px)] leading-[1.08] tracking-[-0.01em]" text={sale.title || 'Flash Sale'} />
							</Link>
						</div>
						<div className="shrink-0">
							<FlashSaleCountdown endsAt={sale.ends_at} />
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<Link
							href="/flash-sale"
							className="press text-[13px] font-bold flex items-center gap-1.5"
							style={{ color: '#432C63' }}
						>
							<span className="link-line">Shop all deals</span> <span aria-hidden="true" className="arrow inline-block">→</span>
						</Link>
					</div>
				</div>

				<FlashSaleGrid items={sale.items} limit={6} />
			</div>
		</section>
	);
};
