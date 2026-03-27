import type { ReadonlyURLSearchParams } from 'next/navigation';

const getOption = (label: string) => {
	switch (label) {
		case 'size':
			return 'variants.size';
		case 'color':
			return 'variants.color';
		case 'condition':
			return 'variants.condition';
		case 'rating':
			return 'average_rating';
		case 'brand':
			return 'brand.name';
		case 'store':
			return 'seller.handle';
		case 'type':
			return 'type.value';
		case 'category_name':
			return 'categories.name';
		default:
			return '';
	}
};

export const getFacedFilters = (filters: ReadonlyURLSearchParams): string => {
	let facet = '';

	let minPrice = null;
	let maxPrice = null;

	let rating = '';

	for (const [key, value] of filters.entries()) {
		if (
			key !== 'min_price' &&
			key !== 'max_price' &&
			key !== 'sale' &&
			key !== 'query' &&
			key !== 'page' &&
			key !== 'products[page]' &&
			key !== 'sortBy' &&
			key !== 'rating'
		) {
			const attribute = getOption(key);
			if (!attribute) continue;
			let values = '';
			const splittedSize = value.split(',');
			if (splittedSize.length > 1) {
				splittedSize.map(
					(value, index) =>
						(values += `${attribute}:"${value}" ${
							index + 1 < splittedSize.length ? 'OR ' : ''
						}`),
				);
			} else {
				values += `${attribute}:"${splittedSize[0]}"`;
			}
			facet += ` AND ${values}`;
		} else {
			if (key === 'min_price') minPrice = value;
			if (key === 'max_price') maxPrice = value;

			if (key === 'rating') {
				let values = '';
				const splited = value.split(',');
				if (splited.length > 1) {
					splited.map(
						(value, index) =>
							(values += `${getOption(key)} >= ${value} ${
								index + 1 < splited.length ? 'OR ' : ''
							}`),
					);
				} else {
					values += `${getOption(key)} >=${splited[0]}`;
				}
				rating += ` AND ${values}`;
			}
		}
	}

	// Prices in Algolia are stored in smallest currency unit (centavos for PHP).
	// UI inputs are in major units (₱), so multiply by 100 before filtering.
	const toSmallestUnit = (v: string) => Math.round(Number(v) * 100);
	const priceFilter =
		minPrice && maxPrice
			? ` AND variants.prices.amount:${toSmallestUnit(minPrice)} TO ${toSmallestUnit(maxPrice)}`
			: minPrice
				? ` AND variants.prices.amount >= ${toSmallestUnit(minPrice)}`
				: maxPrice
					? ` AND variants.prices.amount <= ${toSmallestUnit(maxPrice)}`
					: '';

	return facet + priceFilter + rating;
};
