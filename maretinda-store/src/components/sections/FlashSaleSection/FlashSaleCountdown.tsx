'use client';

import { useEffect, useState } from 'react';

const TARGET_HOURS = 2;

function getInitialSeconds() {
	return TARGET_HOURS * 60 * 60;
}

export const FlashSaleCountdown = () => {
	const [seconds, setSeconds] = useState(getInitialSeconds);

	useEffect(() => {
		const id = setInterval(() => {
			setSeconds((s) => (s > 0 ? s - 1 : 0));
		}, 1000);
		return () => clearInterval(id);
	}, []);

	const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
	const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
	const ss = String(seconds % 60).padStart(2, '0');

	return (
		<div className="flex items-center gap-1 font-mono font-bold text-[14px]">
			<span className="text-[12px] text-[#404040] mr-1">Ends in</span>
			{[hh, mm, ss].map((unit, i) => (
				<span key={i} className="contents">
					<span className="bg-[#1B1B1B] text-white px-2 py-1.5 rounded-md tabular-nums">
						{unit}
					</span>
					{i < 2 && <span className="text-[#1B1B1B]/40">:</span>}
				</span>
			))}
		</div>
	);
};
