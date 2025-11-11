'use client';

import type { HttpTypes } from '@medusajs/types';
import { redirect, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Input } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SearchIcon2 } from '@/icons';
import { listProducts } from '@/lib/data/products';
import { getProductPrice } from '@/lib/helpers/get-product-price';

export const NavbarSearch = ({
	categories = [],
}: {
	categories: HttpTypes.StoreProductCategory[];
}) => {
	const [prod, setProd] = useState<HttpTypes.StoreProduct[] | []>([]);
	const [open, setOpen] = useState(false);
	const searchParams = useSearchParams();
	const [searchCategory, setSearchCategory] = useState(
		categories.find(({ handle }) => handle === searchParams.get('category'))
			?.id || '',
	);
	const [categoryHandle, setCategoryHandle] = useState(
		searchParams.get('category') || '',
	);

	const [search, setSearch] = useState(searchParams.get('query') || '');

	const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (search) {
			redirect(`/categories?query=${search}&category=${categoryHandle}`);
		} else {
			redirect(`/`);
		}
	};

	const options = [
		{
			label: 'All Categories',
			value: '',
		},
		...categories.map(({ name, id }) => {
			return {
				label: name,
				value: id,
			};
		}),
	];

	useEffect(() => {
		listProducts({
			category_id:
				searchCategory === 'All Categories' ? '' : searchCategory,
			countryCode: 'ph',
			queryParams: {
				fields: '+handle,+title',
				q: search,
			},
		}).then(({ response }) => {
			setProd(
				response.products
					.filter((prod) => {
						const { cheapestPrice } = getProductPrice({
							product: prod,
						});
						return Boolean(cheapestPrice) && prod;
					})
					.slice(0, 3),
			);
		});
	}, [searchCategory, search]);

	return (
		<form
			className="flex items-center w-full relative"
			method="POST"
			onSubmit={submitHandler}
		>
			<Input
				changeDropdownValue={(e) => {
					setSearchCategory(e);
					setCategoryHandle(
						categories.find(({ id }) => id === e)?.handle || '',
					);
				}}
				changeValue={setSearch}
				className="text-base bg-white rounded-[62px] w-full border-0 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)]"
				icon={<SearchIcon2 color="#372248" />}
				initialDropdownValue={searchCategory}
				isDropdownCategory
				onBlur={() => setTimeout(() => setOpen(false), 200)}
				onFocus={() => setOpen(true)}
				options={options}
				placeholder="Search for products..."
				value={search}
			/>
			<input className="hidden" type="submit" />
			{open &&
				(search ? (
					<div className="absolute mx-auto px-3 py-6 top-full mt-2 w-full bg-white z-50 rounded-lg shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)]">
						<div className="flex flex-col gap-3">
							{prod.length > 0 ? (
								prod.map((link) => (
									<LocalizedClientLink
										className="text-base !font-medium px-4 block w-full"
										href={`/products/${link.handle}`}
										key={link.title}
									>
										{link.title}
									</LocalizedClientLink>
								))
							) : (
								<div className="text-center w-full">
									<p className="text-lg !font-semibold">
										Sorry, we can&apos;t find any results
										for your criteria
									</p>
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="absolute mx-auto px-3 py-6 top-full mt-2 w-full bg-white z-50 rounded-lg shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)]">
						<div className="flex flex-col gap-3 m-0">
							<h3 className="text-xl mb-1 !font-semibold px-4 w-full text-black">
								Trending Searches
							</h3>
							{/* Fix this where the items are from the suggestions */}
							{/* {column.items.map((link) => (
								<LocalizedClientLink
									className="text-base !font-medium px-4 block w-full hover:bg-gray-50 transition-colors"
									href={`/categories/${link.path}`}
									key={link.label}
									onClick={onClick}
								>
									{link.label}
								</LocalizedClientLink>
							))} */}
							<LocalizedClientLink
								className="text-base !font-medium px-4 block w-full text-black hover:bg-gray-100 transition-colors"
								href={`/categories/#`}
								onClick={() => {}}
							>
								Neque minus pariatur est dolorem fugit
							</LocalizedClientLink>
							<LocalizedClientLink
								className="text-base !font-medium px-4 block w-full text-black hover:bg-gray-100 transition-colors"
								href={`/categories/#`}
								onClick={() => {}}
							>
								Neque minus pariatur est dolorem fugit
							</LocalizedClientLink>
							<LocalizedClientLink
								className="text-base !font-medium px-4 block w-full text-black hover:bg-gray-100 transition-colors"
								href={`/categories/#`}
								onClick={() => {}}
							>
								Neque minus pariatur est dolorem fugit
							</LocalizedClientLink>
						</div>
					</div>
				))}
		</form>
	);
};
