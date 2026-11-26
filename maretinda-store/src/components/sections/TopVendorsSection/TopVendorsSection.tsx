import Link from 'next/link';

import { SellerAvatar } from '@/components/cells/SellerAvatar/SellerAvatar';
import { Reveal } from '@/components/motion';
import { HomeHeading } from '@/i18n/HomeHeading';
import { HomeText } from '@/i18n/HomeText';
import { listSellers } from '@/lib/data/seller';
import type { SellerProps } from '@/types/seller';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';
const BANNER_COLORS = ['#E8DEF7', '#E2D9C7', '#D9EAE2', '#F2D9E2', '#D9E5F0', '#F0E4CC', '#FFE2D2', '#D8EAD9'];

const VerifiedBadge = () => (
	<svg role="img" aria-label="Verified seller" width="14" height="14" viewBox="0 0 24 24" fill="#7FA8C9"><title>Verified seller</title>
		<circle cx="12" cy="12" r="12" />
		<path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" fill="none" />
	</svg>
);

export const TopsellersSection = async () => {
	const { sellers } = await listSellers({ limit: 8 });
	if (!sellers?.length) return null;

	return (
		<section className="bg-white">
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
				{/* Header */}
				<div className="flex items-end justify-between mb-7 lg:mb-8 flex-wrap gap-4">
					<HomeHeading className="font-serif text-[34px] leading-tight tracking-[-0.01em] text-[#1a1a1a] lg:text-[42px]" eyebrow="sellersLabel" k="sellersHeading" />
					<Link href="/sellers" className="press shrink-0 text-[13px] font-bold" style={{ color: '#432C63' }}>
						<span className="link-line"><HomeText k="sellersBrowse" /></span>
					</Link>
				</div>

				{/* seller cards */}
				<Reveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" variant="group">
					{sellers.map((seller: SellerProps, i: number) => {
						const bannerBg = BANNER_COLORS[i % BANNER_COLORS.length];

						return (
							<Link
								key={seller.id}
								href={`/sellers/${seller.handle}`}
								className="group rounded-[22px] border bg-white overflow-hidden block transition-[box-shadow,transform] duration-500 ease-soft hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgba(67,44,99,0.28)]"
								style={{ borderColor: '#EDEAE3' }}
							>
								{/* Banner */}
								<div
									className="h-20"
									style={{ backgroundColor: bannerBg, backgroundImage: STRIPE }}
								/>

								{/* Card body */}
								<div className="px-4 pb-4 -mt-8">
									{/* Avatar */}
									<div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white transition-transform duration-500 ease-spring group-hover:scale-110">
										<SellerAvatar alt={seller.name} photo={seller.photo} size={56} />
									</div>

									{/* Name + verified */}
									<div className="mt-3 flex items-center gap-1.5">
										<h4 className="text-[15px] font-extrabold text-[#1B1B1B] truncate">{seller.name}</h4>
										{seller.verification_status === 'verified' && <VerifiedBadge />}
									</div>
									{seller.description && (
										<div className="text-[11.5px] mt-0.5 line-clamp-1" style={{ color: '#737373' }}>
											{seller.description}
										</div>
									)}

									{/* CTA */}
									<span className="mt-3.5 flex h-9 w-full items-center justify-center rounded-full border border-[#EDEAE3] bg-[#FAF8F5] text-[12px] font-bold text-[#1B1B1B] transition-colors duration-300 group-hover:border-[#432C63] group-hover:bg-[#432C63] group-hover:text-white">
										<HomeText k="sellerVisitShop" />
									</span>
								</div>
							</Link>
						);
					})}
				</Reveal>
			</div>
		</section>
	);
};
