import { SkeletonProductCard } from '../ProductCard/SkeletonProductCard';

export const ProductListingSkeleton = ({ cards = 12 }: { cards?: number }) => (
	<div aria-busy="true" aria-label="Loading products" role="status">
		<div className="mb-5 flex items-center justify-between">
			<div className="shimmer h-5 w-28 rounded-full" />
			<div className="shimmer h-11 w-48 rounded-full" />
		</div>
		<div className="flex gap-8">
			<div className="shimmer hidden h-[520px] w-[256px] shrink-0 rounded-[22px] lg:block" />
			<div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: cards }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: identical placeholders
					<SkeletonProductCard key={i} />
				))}
			</div>
		</div>
	</div>
);
