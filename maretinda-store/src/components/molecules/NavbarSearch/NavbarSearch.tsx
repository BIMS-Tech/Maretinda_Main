'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Input } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SearchIcon2 } from '@/icons';

type Category = {
	id: string;
	name: string;
	handle: string;
};

export const NavbarSearch = ({
	categories = [],
}: {
	categories?: Category[];
}) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState(searchParams.get('query') || '');
	const [selectedCategory, setSelectedCategory] = useState('all');

	const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setOpen(false);
		const query = search.trim();
		if (selectedCategory && selectedCategory !== 'all') {
			router.push(
				`/categories/${selectedCategory}${query ? `?query=${encodeURIComponent(query)}` : ''}`,
			);
		} else if (query) {
			router.push(`/categories?query=${encodeURIComponent(query)}`);
		} else {
			router.push(`/categories`);
		}
	};

	const options = [
		{ label: 'All Categories', value: 'all' },
		...categories.map((cat) => ({
			label: cat.name,
			value: cat.handle.trim(),
		})),
	];

	const matchingCategories = search.trim()
		? categories.filter((cat) =>
				cat.name.toLowerCase().includes(search.toLowerCase()),
			)
		: categories;

	return (
		<form
			className="flex items-center w-full relative"
			onSubmit={submitHandler}
		>
			<Input
				changeValue={setSearch}
				className="text-base bg-white rounded-[62px] w-full border-0 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)]"
				icon={<SearchIcon2 color="#372248" />}
				isDropdownCategory
				onBlur={() => setTimeout(() => setOpen(false), 150)}
				onDropdownChange={setSelectedCategory}
				onFocus={() => setOpen(true)}
				options={options}
				placeholder="Search for products..."
				value={search}
			/>
			<input className="hidden" type="submit" />
			{open && (
				<div className="absolute mx-auto px-3 py-6 top-full mt-2 w-full bg-white z-50 rounded-lg shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)]">
					<div className="flex flex-col gap-3 m-0">
						<h3 className="text-xl mb-1 !font-semibold px-4 w-full text-black">
							{search.trim()
								? 'Matching Categories'
								: 'Browse Categories'}
						</h3>
						{matchingCategories.length === 0 ? (
							<p className="text-base px-4 text-gray-500">
								No categories found
							</p>
						) : (
							matchingCategories.map((cat) => (
								<LocalizedClientLink
									className="text-base !font-medium px-4 block w-full text-black hover:bg-gray-100 transition-colors rounded"
									href={`/categories/${cat.handle.trim()}`}
									key={cat.id}
									onMouseDown={() => setOpen(false)}
								>
									{cat.name}
								</LocalizedClientLink>
							))
						)}
					</div>
				</div>
			)}
		</form>
	);
};
