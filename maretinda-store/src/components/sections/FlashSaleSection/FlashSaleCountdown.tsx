'use client';

import React, { useEffect, useState } from 'react';

function msUntil(iso: string): number {
	return Math.max(0, new Date(iso).getTime() - Date.now())
}

export const FlashSaleCountdown = ({ endsAt }: { endsAt: string }) => {
	const [ms, setMs] = useState(() => msUntil(endsAt))

	useEffect(() => {
		setMs(msUntil(endsAt))
		const id = setInterval(() => {
			const remaining = msUntil(endsAt)
			setMs(remaining)
			if (remaining === 0) clearInterval(id)
		}, 1000)
		return () => clearInterval(id)
	}, [endsAt])

	const totalSeconds = Math.floor(ms / 1000)
	const dd = Math.floor(totalSeconds / 86400)
	const hh = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0')
	const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
	const ss = String(totalSeconds % 60).padStart(2, '0')

	if (ms === 0) {
		return (
			<div className="flex items-center gap-1 font-mono font-bold text-[14px]">
				<span className="text-[12px] text-red-500 mr-1 font-semibold">Sale ended</span>
			</div>
		)
	}

	const units = dd > 0
		? [{ label: `${dd}d`, value: `${dd}` }, { label: 'h', value: hh }, { label: 'm', value: mm }]
		: [{ label: 'h', value: hh }, { label: 'm', value: mm }, { label: 's', value: ss }]

	return (
		<div className="flex items-center gap-1 font-mono font-bold text-[14px]">
			<span className="text-[12px] text-[#404040] mr-1">Ends in</span>
			{units.map(({ value }, i) => (
				<React.Fragment key={i}>
					<span
						suppressHydrationWarning
						className="bg-[#1B1B1B] text-white px-2 py-1.5 rounded-md tabular-nums"
					>
						{value}
					</span>
					{i < units.length - 1 && <span className="text-[#1B1B1B]/40">:</span>}
				</React.Fragment>
			))}
		</div>
	)
}
