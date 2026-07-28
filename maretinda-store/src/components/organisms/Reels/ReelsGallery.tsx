'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import type { Reel } from '@/lib/data/reels';

import { ReelViewer } from './ReelViewer';

function formatDuration(seconds?: number | null) {
	if (!seconds || seconds <= 0) return null;
	const mins = Math.floor(seconds / 60);
	const secs = Math.round(seconds % 60);
	return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Poster grid for a set of reels. Clicking a card opens the full-screen
 * viewer starting on that reel; the viewer owns playback, likes and seller chat.
 */
export const ReelsGallery = ({
	reels,
	user,
	showSeller = false,
}: {
	reels: Reel[];
	user: HttpTypes.StoreCustomer | null;
	showSeller?: boolean;
}) => {
	const [openAt, setOpenAt] = useState<number | null>(null);

	if (!reels.length) {
		return (
			<div className="py-14 text-center">
				<div className="text-[34px] mb-3">🎬</div>
				<p className="text-[15px] font-semibold text-[#1B1B1B]">No reels yet</p>
				<p className="text-[13px] mt-1" style={{ color: '#737373' }}>
					Check back soon — new videos land here first
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
				{reels.map((reel, i) => {
					const duration = formatDuration(reel.duration);

					return (
						<button
							className="group text-left rounded-xl overflow-hidden border bg-black"
							key={reel.id}
							onClick={() => setOpenAt(i)}
							style={{ borderColor: '#EDEAE3' }}
							type="button"
						>
							<div className="relative aspect-[9/16]">
								{reel.thumbnail_url ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										alt={reel.title || 'Reel'}
										className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
										loading="lazy"
										src={reel.thumbnail_url}
									/>
								) : (
									<video
										className="w-full h-full object-cover"
										muted
										preload="metadata"
										src={`${reel.video_url}#t=0.1`}
									/>
								)}

								<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

								{duration && (
									<span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[11px]">
										{duration}
									</span>
								)}

								<div className="absolute bottom-0 inset-x-0 p-2.5">
									{showSeller && (
										<p className="text-white/80 text-[11px] truncate">
											{reel.seller_name}
										</p>
									)}
									{reel.title && (
										<p className="text-white text-[12.5px] font-semibold line-clamp-2">
											{reel.title}
										</p>
									)}
									<div className="flex gap-3 mt-1 text-white/75 text-[11px]">
										<span>{reel.like_count} likes</span>
										<span>{reel.view_count} views</span>
									</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{openAt !== null && (
				<ReelViewer
					onClose={() => setOpenAt(null)}
					reels={reels}
					startIndex={openAt}
					user={user}
				/>
			)}
		</>
	);
};
