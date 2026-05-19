import Image from 'next/image';
import Link from 'next/link';

import { HomeText } from '@/i18n/HomeText';
import { listCollections } from '@/lib/data/collections';
import type { HttpTypes } from '@medusajs/types';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';

const CARD_COLORS = [
	'#B8A6D6', '#D9CFB8', '#C8E2D0', '#E2D9F3',
	'#F2D9DB', '#D9E5F0', '#F0E4CC', '#FFE2D2',
];

function getMeta(col: HttpTypes.StoreCollection) {
	return (col.metadata ?? {}) as Record<string, string>;
}

function getImage(col: HttpTypes.StoreCollection): string | null {
	const meta = getMeta(col);
	return meta.image || meta.thumbnail || col.products?.[0]?.thumbnail || null;
}

function getDesc(col: HttpTypes.StoreCollection): string {
	const meta = getMeta(col);
	return meta.description || meta.subtitle || '';
}

export const FeaturedCollectionsSection = async () => {
	const { collections } = await listCollections({
		limit: '8',
		fields: 'id,title,handle,metadata,*products,products.thumbnail',
	});
	if (!collections?.length) return null;

	const [featured, ...rest] = collections;
	const mediumCards = rest.slice(0, 2);
	const smallCards = rest.slice(2, 6);

	const featuredImage = getImage(featured);

	return (
		<section className="bg-white">
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
				{/* Header */}
				<div className="flex items-end justify-between mb-7 lg:mb-8">
					<div>
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>
							<HomeText k="collectionsLabel" />
						</div>
						<h2 className="mt-2 font-serif tracking-[-0.01em] text-[#1a1a1a]" style={{ fontSize: '40px' }}>
							<HomeText k="collectionsHeading" />
						</h2>
					</div>
					<Link href="/collections" className="text-[13px] font-bold flex items-center gap-1.5 hover:underline" style={{ color: '#432C63' }}>
						<HomeText k="viewAllCollections" />
					</Link>
				</div>

				<div className="grid grid-cols-12 gap-4 lg:gap-5">
					{/* Large featured card */}
					<Link
						href={`/collections/${featured.handle}`}
						className="col-span-12 lg:col-span-6 relative rounded-2xl overflow-hidden border h-[420px] block group"
						style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
					>
						{featuredImage ? (
							<Image
								src={featuredImage}
								alt={featured.title}
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-105"
								sizes="(max-width: 1024px) 100vw, 50vw"
							/>
						) : (
							<div className="absolute inset-0" style={{ backgroundColor: CARD_COLORS[0], backgroundImage: STRIPE }} />
						)}
						<div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(20,10,35,0.85) 0%, rgba(20,10,35,0.35) 50%, transparent 100%)' }} />
						<div className="absolute top-5 left-5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFC533', color: '#432C63' }}>New</div>
						<div className="absolute bottom-0 left-0 right-0 p-7 text-white">
							<div className="text-[11.5px] font-bold tracking-[0.16em] uppercase" style={{ color: '#FFC533' }}>Editor&apos;s pick</div>
							<h3 className="mt-2 font-serif text-[30px] lg:text-[34px] leading-[1.05] tracking-tight max-w-[420px]">
								{featured.title}
							</h3>
							{getDesc(featured) && (
								<p className="mt-3 text-[14px] text-white/85 max-w-[440px]">{getDesc(featured)}</p>
							)}
							<div className="mt-5 inline-flex items-center gap-2 bg-white text-[#1B1B1B] px-5 h-11 rounded-full text-[13.5px] font-bold">
								Explore collection
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
							</div>
						</div>
					</Link>

					{/* Right column */}
					<div className="col-span-12 lg:col-span-6 grid grid-cols-2 grid-rows-2 gap-4 lg:gap-5">
						{/* Medium cards (top row) */}
						{mediumCards.map((col, i) => {
							const img = getImage(col);
							return (
								<Link
									key={col.id}
									href={`/collections/${col.handle}`}
									className="col-span-2 lg:col-span-1 relative rounded-2xl overflow-hidden border h-[200px] block group"
									style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
								>
									{img ? (
										<Image
											src={img}
											alt={col.title}
											fill
											className="object-cover transition-transform duration-500 group-hover:scale-105"
											sizes="(max-width: 1024px) 100vw, 25vw"
										/>
									) : (
										<div className="absolute inset-0" style={{ backgroundColor: CARD_COLORS[i + 1], backgroundImage: STRIPE }} />
									)}
									<div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(250,248,245,0.96) 0%, rgba(250,248,245,0.72) 55%, transparent 100%)' }} />
									<div className="absolute inset-0 p-6 flex flex-col justify-between">
										<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70" style={{ color: '#432C63' }}>Collection</div>
										<div>
											<h3 className="text-[22px] font-extrabold leading-[1.1] tracking-tight max-w-[180px] text-[#1B1B1B]">{col.title}</h3>
											<span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: '#432C63' }}>Shop now →</span>
										</div>
									</div>
								</Link>
							);
						})}

						{/* Small cards (bottom row) */}
						{smallCards.map((col, i) => {
							const img = getImage(col);
							return (
								<Link
									key={col.id}
									href={`/collections/${col.handle}`}
									className="relative rounded-2xl overflow-hidden border h-[180px] lg:h-[200px] block group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
									style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
								>
									{img ? (
										<Image
											src={img}
											alt={col.title}
											fill
											className="object-cover transition-transform duration-500 group-hover:scale-105"
											sizes="(max-width: 768px) 50vw, 12.5vw"
										/>
									) : (
										<div className="absolute inset-0" style={{ backgroundColor: CARD_COLORS[i + 3], backgroundImage: STRIPE }} />
									)}
									<div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(250,248,245,0.97) 0%, rgba(250,248,245,0.65) 55%, transparent 100%)' }} />
									<div className="absolute inset-0 p-5 flex flex-col justify-between">
										<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70" style={{ color: '#432C63' }}>Collection</div>
										<div>
											<h3 className="text-[17px] font-extrabold leading-tight text-[#1B1B1B]">{col.title}</h3>
											{getDesc(col) && (
												<div className="text-[12px] mt-0.5 line-clamp-1" style={{ color: '#404040' }}>{getDesc(col)}</div>
											)}
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
