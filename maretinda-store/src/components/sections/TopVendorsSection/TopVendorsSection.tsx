import Image from 'next/image';
import Link from 'next/link';

import { HomeText } from '@/i18n/HomeText';
import { listSellers } from '@/lib/data/seller';
import type { SellerProps } from '@/types/seller';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';
const BANNER_COLORS = ['#E8DEF7', '#E2D9C7', '#D9EAE2', '#F2D9E2', '#D9E5F0', '#F0E4CC', '#FFE2D2', '#D8EAD9'];
const AVATAR_COLORS = ['#9B80D2', '#D9CFB8', '#5FA88B', '#D98AA1', '#7FA8C9', '#E8B87A', '#E26D5C', '#6BBF8A'];

const VerifiedBadge = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="#7FA8C9">
		<circle cx="12" cy="12" r="12" />
		<path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" fill="none" />
	</svg>
);

const StarIcon = () => (
	<svg width="11" height="11" viewBox="0 0 24 24" fill="#FFC533">
		<path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
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
					<div>
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}><HomeText k="sellersLabel" /></div>
						<h2 className="mt-2 font-serif tracking-[-0.01em] text-[#1a1a1a]" style={{ fontSize: '40px' }}><HomeText k="sellersHeading" /></h2>
					</div>
					<Link href="/sellers" className="text-[13px] font-bold flex items-center gap-1.5 hover:underline" style={{ color: '#432C63' }}>
						<HomeText k="sellersBrowse" />
					</Link>
				</div>

				{/* seller cards */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{sellers.map((seller: SellerProps, i: number) => {
						const bannerBg = BANNER_COLORS[i % BANNER_COLORS.length];
						const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];

						return (
							<Link
								key={seller.id}
								href={`/sellers/${seller.handle}`}
								className="rounded-2xl border bg-white overflow-hidden block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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
									<div
										className="w-16 h-16 rounded-full border-4 border-white overflow-hidden flex-shrink-0"
										style={{ backgroundColor: avatarBg, boxShadow: '0 1px 2px rgba(20,20,20,0.04)' }}
									>
										{seller.photo ? (
											<Image
												src={seller.photo}
												alt={seller.name}
												width={64}
												height={64}
												className="w-full h-full object-cover"
											/>
										) : (
											<div
												className="w-full h-full flex items-center justify-center text-white font-extrabold text-[22px]"
												style={{ backgroundColor: avatarBg, backgroundImage: STRIPE }}
											>
												{seller.name.charAt(0).toUpperCase()}
											</div>
										)}
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

									{/* Stats placeholder */}
									<div className="mt-2.5 flex items-center gap-1 text-[11.5px]">
										<StarIcon />
										<b className="text-[#1B1B1B]">New</b>
									</div>

									{/* CTA */}
									<button
										className="mt-3 w-full h-9 rounded-full text-[12px] font-bold transition-colors border hover:border-[#432C63] hover:text-[#432C63]"
										style={{ backgroundColor: '#FAF8F5', borderColor: '#EDEAE3', color: '#1B1B1B' }}
									>
										<HomeText k="sellerVisitShop" />
									</button>
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
};
