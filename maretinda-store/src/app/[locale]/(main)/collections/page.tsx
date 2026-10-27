import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { listCollections } from '@/lib/data/collections';
import type { HttpTypes } from '@medusajs/types';

export const metadata: Metadata = {
	title: 'Collections',
	description: 'Browse every Maretinda collection.',
};

// Same card treatment as the home page's FeaturedCollectionsSection, which
// links its "View all" here
const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';

const CARD_COLORS = [
	'#B8A6D6', '#D9CFB8', '#C8E2D0', '#E2D9F3',
	'#F2D9DB', '#D9E5F0', '#F0E4CC', '#FFE2D2',
];

function getImage(col: HttpTypes.StoreCollection): string | null {
	const meta = (col.metadata ?? {}) as Record<string, string>;
	return meta.image_url || meta.image || meta.thumbnail || col.products?.[0]?.thumbnail || null;
}

function getDesc(col: HttpTypes.StoreCollection): string {
	const meta = (col.metadata ?? {}) as Record<string, string>;
	return meta.description || meta.subtitle || '';
}

export default async function CollectionsPage() {
	const { collections } = await listCollections({
		fields: 'id,title,handle,metadata,*products,products.thumbnail',
	});

	return (
		<main className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
			<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>
				Collections
			</div>
			<h1 className="mt-2 mb-8 font-serif tracking-[-0.01em] text-[#1a1a1a] text-[32px] lg:text-[40px]">
				All collections
			</h1>

			{!collections?.length ? (
				<p className="text-[14.5px]" style={{ color: '#6B6473' }}>
					No collections yet. Check back soon.
				</p>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
					{collections.map((col, i) => {
						const img = getImage(col);
						return (
							<Link
								key={col.id}
								href={`/collections/${col.handle}`}
								className="relative rounded-2xl overflow-hidden border h-[200px] lg:h-[240px] block group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
								style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
							>
								{img ? (
									<Image
										src={img}
										alt={col.title}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-105"
										sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
									/>
								) : (
									<div
										className="absolute inset-0"
										style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length], backgroundImage: STRIPE }}
									/>
								)}
								<div
									className="absolute inset-0"
									style={{ background: 'linear-gradient(to top, rgba(250,248,245,0.97) 0%, rgba(250,248,245,0.65) 55%, transparent 100%)' }}
								/>
								<div className="absolute inset-0 p-5 flex flex-col justify-between">
									<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70" style={{ color: '#432C63' }}>
										Collection
									</div>
									<div>
										<h2 className="text-[17px] lg:text-[19px] font-extrabold leading-tight text-[#1B1B1B]">{col.title}</h2>
										{getDesc(col) && (
											<div className="text-[12px] mt-0.5 line-clamp-2" style={{ color: '#404040' }}>
												{getDesc(col)}
											</div>
										)}
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</main>
	);
}
