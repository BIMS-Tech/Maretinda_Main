'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/atoms';
import { SearchIcon } from '@/icons';

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
			className="flex items-center"
			method="POST"
			onSubmit={submitHandler}
		>
			<Input
				changeValue={setSearch}
				icon={<SearchIcon />}
				placeholder="Search product"
				value={search}
			/>
			<input className="hidden" type="submit" />
		</form>
	);
};
