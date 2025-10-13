'use client';

import { InstantSearch, TrendingItems } from 'react-instantsearch';

import { client } from '@/lib/client';

export const AlgoliaTrendingListings = () => {
	return (
		<InstantSearch indexName="products" routing searchClient={client}>
			<section className="py-8 w-full">
				<h2 className="mb-6 heading-lg font-bold tracking-tight uppercase">
					Trending Listings
				</h2>

				<TrendingItems
					emptyComponent={() => <div>No recommendation</div>}
					limit={4}
				/>
			</section>
		</InstantSearch>
	);
};
