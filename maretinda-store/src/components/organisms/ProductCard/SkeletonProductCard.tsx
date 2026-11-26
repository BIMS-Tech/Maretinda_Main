export const SkeletonProductCard = () => (
	<div aria-hidden="true" className="flex w-full flex-col">
		<div className="shimmer aspect-square w-full rounded-[20px]" />
		<div className="shimmer mt-3 h-3 w-1/3 rounded-full" />
		<div className="shimmer mt-2 h-3.5 w-4/5 rounded-full" />
		<div className="shimmer mt-2.5 h-4 w-1/4 rounded-full" />
	</div>
);
