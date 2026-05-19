'use client';

import { useState } from 'react';

import { Pagination } from '@/components/cells';
import { usePagination } from '@/hooks/usePagination';
import { useLanguage } from '@/providers/LanguageProvider';

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
	const { t } = useLanguage();
	const { currentPage, setPage } = usePagination();
	const [loading, setLoading] = useState(false);

	const setPageHandler = (page: number) => {
		setPage(`${page}`);
	};

	const handleLoadMore = () => {
		setLoading(true);
		setTimeout(() => {
			setPageLimit(pageLimit + offset);
			setLoading(false);
		}, 300);
	};

	return (
		<div className="mt-8 flex justify-center">
			{isInfinite ? (
				<button
					onClick={handleLoadMore}
					disabled={loading}
					className="h-11 px-8 rounded-full font-bold text-[13.5px] text-white flex items-center gap-2.5 transition-opacity hover:opacity-90 disabled:opacity-60"
					style={{ backgroundColor: '#432C63' }}
				>
					{loading ? (
						<>
							<svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
								<path d="M21 12a9 9 0 1 1-6.219-8.56" />
							</svg>
							{t.pagination.loading}
						</>
					) : (
						<>
							{t.pagination.loadMore}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
								<path d="M5 12h14M13 5l7 7-7 7" />
							</svg>
						</>
					)}
				</button>
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
