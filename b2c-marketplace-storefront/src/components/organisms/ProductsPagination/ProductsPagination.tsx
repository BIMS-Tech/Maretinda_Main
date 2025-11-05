'use client';

import { ArrowLongRight } from '@medusajs/icons';

import { Button } from '@/components/atoms';
import { Pagination } from '@/components/cells';
import { usePagination } from '@/hooks/usePagination';

export const ProductsPagination = ({
	isInfinite,
	offset,
	pages = 1,
	pageLimit,
	setPageLimit,
}: {
	isInfinite: boolean;
	offset: number;
	pages?: number;
	pageLimit: number;
	setPageLimit: React.Dispatch<React.SetStateAction<number>>;
}) => {
	const { currentPage, setPage } = usePagination();

	const setPageHandler = (page: number) => {
		setPage(`${page}`);
	};
	return (
		<div className="mt-6 flex justify-center">
			{isInfinite ? (
				<div className="flex items-center">
					<Button
						className="inline-flex items-center justify-center sm:px-8 py-[15px] sm:py-[10px] rounded-[6px] transition-all duration-300 bg-brand-cta-400 text-black hover:bg-yellow-500 font-medium text-base hover:scale-105 shadow-lg w-[220px] sm:w-auto h-[45px] sm:h-auto"
						onClick={() => {
							setPageLimit(pageLimit + offset);
						}}
						variant="text"
					>
						<p className="mr-1">Load More</p>
						<ArrowLongRight color="black" height={15} width={15} />
					</Button>
				</div>
			) : (
				<Pagination
					currentPage={currentPage}
					pages={pages}
					setPage={setPageHandler}
				/>
			)}
		</div>
	);
};
