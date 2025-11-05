'use client';

import { useState } from 'react';

import { PRODUCT_LIMIT } from '@/const';

import { ProductsPagination } from './ProductsPagination';

export const ProductsPaginationWrapper = ({
	pages,
}: {
	pages: number;
}) => {
	const [pageLimit, setPageLimit] = useState(PRODUCT_LIMIT);

	return (
		<ProductsPagination
			isInfinite={false}
			offset={PRODUCT_LIMIT}
			pages={pages}
			pageLimit={pageLimit}
			setPageLimit={setPageLimit}
		/>
	);
};

