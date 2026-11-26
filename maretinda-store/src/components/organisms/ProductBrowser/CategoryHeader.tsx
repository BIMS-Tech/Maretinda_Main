import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MaskedText } from '@/components/motion';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
import { searchProductsOrNothing } from '@/lib/data/search';
import { sortCategories } from '@/lib/utils';

/** The shop's own banner for a category, when it has one: a drawn header otherwise. */
export async function CategoryHeader({
	category,
	parent,
	active,
}: {
	category: HttpTypes.StoreProductCategory;
	/** The category above, when this is one of its sub-categories */
	parent?: HttpTypes.StoreProductCategory;
	active?: string;
}) {
	const top = parent ?? category;
	const url = category.metadata?.image_url as string | undefined;
	const image = url?.startsWith('http') ? url : null;
	// Without a banner of its own, the category shows off what is in it
	const picks = image
		? []
		: (await searchProductsOrNothing(`category_id=${category.id}&sort=popular&in_stock=1&limit=8`)).products.filter((p) => p.thumbnail).slice(0, 3);
	const children = [...(top.category_children ?? [])].sort(sortCategories);

	return (
		<>
			<div
				className="relative flex min-h-[170px] items-center overflow-hidden rounded-[26px] px-7 py-9 text-white sm:px-10 lg:min-h-[210px] lg:px-14"
				style={{ background: 'linear-gradient(120deg, #2A1B3E 0%, #432C63 55%, #6B3F8C 100%)' }}
			>
				{image ? (
					<>
						<Image alt="" className="image-settle object-cover" fill priority sizes="(max-width: 1360px) 100vw, 1360px" src={image} unoptimized />
						<div className="absolute inset-0 bg-gradient-to-r from-[#1E1430]/85 via-[#1E1430]/45 to-transparent" />
					</>
				) : (
					<>
						<div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 14px)' }} />
						<div aria-hidden="true" className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-[#FFC533]/20 blur-3xl" />
						<div aria-hidden="true" className="absolute inset-y-0 right-8 hidden items-center gap-4 md:flex lg:right-14">
							{picks.map((p, i) => (
								<span
									className="pop-in relative block h-[118px] w-[118px] overflow-hidden rounded-[24px] shadow-[0_18px_40px_rgba(0,0,0,0.25)] lg:h-[138px] lg:w-[138px]"
									key={p.id}
									style={{ '--delay': `${260 + i * 110}ms`, backgroundColor: groundOf(p.id), marginTop: [0, 34, -18][i] } as React.CSSProperties}
								>
									<Image alt="" className="object-contain p-3 mix-blend-multiply" fill sizes="140px" src={cardImage(p.thumbnail) as string} />
								</span>
							))}
						</div>
					</>
				)}
				<div className="relative">
					{parent && (
						<LocalizedClientLink className="rise-in mb-1 inline-block text-[12.5px] font-semibold text-white/70 hover:text-white" href={`/categories/${parent.handle.trim()}`}>
							<span className="link-line">{parent.name}</span>
						</LocalizedClientLink>
					)}
					<h1 className="font-serif text-[36px] leading-[1.08] tracking-[-0.01em] sm:text-[46px] lg:text-[54px]">
						<MaskedText play text={category.name} />
					</h1>
					{category.description && (
						<p className="rise-in mt-2 max-w-xl text-[14px] leading-relaxed text-white/80" style={{ '--delay': '220ms' } as React.CSSProperties}>
							{category.description}
						</p>
					)}
				</div>
			</div>

			{children.length > 0 && (
				<nav aria-label={`${top.name} categories`} className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
					{[{ handle: '', id: 'all', name: 'All' }, ...children].map((child, i) => {
						const on = (active ?? '') === child.handle;
						return (
							<LocalizedClientLink
								aria-current={on ? 'page' : undefined}
								className={`rise-in press shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold ${
									on ? 'border-[#432C63] bg-[#432C63] text-white' : 'border-[#E7E1EE] bg-white text-[#404040] hover:border-[#432C63] hover:text-[#432C63]'
								}`}
								href={`/categories/${top.handle.trim()}${child.handle ? `/${child.handle.trim()}` : ''}`}
								key={child.id}
								style={{ '--delay': `${160 + i * 45}ms` }}
							>
								{child.name}
							</LocalizedClientLink>
						);
					})}
				</nav>
			)}
		</>
	);
}
