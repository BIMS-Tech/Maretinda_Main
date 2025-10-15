'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/atoms';
import { SearchIcon2 } from '@/icons';

export const NavbarSearch = () => {
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
			className="flex items-center w-full"
			method="POST"
			onSubmit={submitHandler}
		>
			<Input
				changeValue={setSearch}
				className="text-base bg-white rounded-[62px] w-full border-0 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)]"
				icon={<SearchIcon2 color="#372248" />}
				isDropdownCategory
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
		</form>
	);
};
