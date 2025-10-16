'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SearchIcon2 } from '@/icons';

export const NavbarSearch = () => {
	const [open, setOpen] = useState(false);
	const searchParams = useSearchParams();

	const [search, setSearch] = useState(searchParams.get('query') || '');

	const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (search) {
			redirect(`/categories?query=${search}`);
		} else {
			redirect(`/categories`);
		}
	};

	return (
		<form
			className="flex items-center w-full relative"
			method="POST"
			onSubmit={submitHandler}
		>
			<Input
				changeValue={setSearch}
				className="text-base bg-white rounded-[62px] w-full border-0 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)]"
				icon={<SearchIcon2 color="#372248" />}
				isDropdownCategory
				onBlur={() => setOpen(false)}
				onFocus={() => setOpen(true)}
				options={[
					{
						label: 'All Categories',
						value: 'All Categories',
					},
					{
						label: "Men's Fashion",
						value: "Men's Fashion",
					},
					{
						label: 'Books',
						value: 'Books',
					},
					{
						label: 'Electronics',
						value: 'Electronics',
					},
					{
						label: 'Girls Fashion',
						value: 'Girls Fashion',
					},
					{
						label: 'Tops',
						value: 'Tops',
					},
					{
						label: 'Shirts',
						value: 'Shirts',
					},
					{
						label: 'Jeans',
						value: 'Jeans',
					},
					{
						label: 'Suits',
						value: 'Suits',
					},
				]}
				placeholder="Search for products..."
				value={search}
			/>
			<input className="hidden" type="submit" />
			{open &&
				(search ? (
					<div className="absolute mx-auto px-3 py-6 top-full mt-2 w-full bg-white z-50 rounded-lg shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)]">
						<div className="flex flex-col gap-3">
							{/* Fix this where it fetches items from the server */}
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
								Lorem ipsum dolor sit amet consectetur
							</LocalizedClientLink>
							<LocalizedClientLink
								className="text-base !font-medium px-4 block w-full text-black hover:bg-gray-100 transition-colors"
								href={`/categories/#`}
								onClick={() => {}}
							>
								Lorem ipsum dolor sit amet consectetur
							</LocalizedClientLink>
							<LocalizedClientLink
								className="text-base !font-medium px-4 block w-full text-black hover:bg-gray-100 transition-colors"
								href={`/categories/#`}
								onClick={() => {}}
							>
								Lorem ipsum dolor sit amet consectetur
							</LocalizedClientLink>
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
