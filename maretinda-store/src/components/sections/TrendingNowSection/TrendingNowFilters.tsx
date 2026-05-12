'use client';

import { useState } from 'react';

const FILTERS = ['All', 'Fashion', 'Beauty', 'Tech', 'Home', 'Food'];

export const TrendingNowFilters = () => {
	const [active, setActive] = useState('All');

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{FILTERS.map((f) => (
				<button
					key={f}
					onClick={() => setActive(f)}
					className="px-4 h-9 rounded-full text-[12.5px] font-semibold transition-colors"
					style={
						active === f
							? { backgroundColor: '#1B1B1B', color: 'white' }
							: { backgroundColor: 'white', color: '#1B1B1B', border: '1px solid #EDEAE3' }
					}
				>
					{f}
				</button>
			))}
		</div>
	);
};
