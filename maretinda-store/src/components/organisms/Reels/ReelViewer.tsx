'use client';

import type { HttpTypes } from '@medusajs/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatBox } from '@/components/cells/ChatBox/ChatBox';
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CloseIcon,
	HeartFilledIcon,
	HeartIcon,
	MessageIcon,
} from '@/icons';
import type { Reel } from '@/lib/data/reels';

/**
 * Full-screen reel player. Reels are navigated vertically (arrows, wheel,
 * touch swipe, ↑/↓ keys). The side panel docks a live chat with the reel's
 * seller — shoppers message the shop directly instead of leaving comments.
 */
export const ReelViewer = ({
	reels,
	startIndex,
	user,
	onClose,
}: {
	reels: Reel[];
	startIndex: number;
	user: HttpTypes.StoreCustomer | null;
	onClose: () => void;
}) => {
	const [index, setIndex] = useState(startIndex);
	const [likes, setLikes] = useState<Record<string, { liked: boolean; count: number }>>(
		() =>
			Object.fromEntries(
				reels.map((r) => [r.id, { liked: !!r.liked, count: r.like_count }]),
			),
	);
	const [likeError, setLikeError] = useState<string | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const touchStartY = useRef<number | null>(null);
	const wheelLock = useRef(false);

	const reel = reels[index];

	const go = useCallback(
		(delta: number) => {
			setIndex((current) => {
				const next = current + delta;
				if (next < 0 || next >= reels.length) return current;
				return next;
			});
		},
		[reels.length],
	);

	// Body scroll lock while the overlay is open.
	useEffect(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'ArrowDown') go(1);
			if (e.key === 'ArrowUp') go(-1);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [go, onClose]);

	// Restart playback and record a view whenever the active reel changes.
	useEffect(() => {
		if (!reel) return;

		const video = videoRef.current;
		if (video) {
			video.currentTime = 0;
			video.play().catch(() => {
				// Autoplay can be blocked; the controls stay available.
			});
		}

		fetch(`/api/reels/${reel.id}/view`, { method: 'POST' }).catch(() => {});
	}, [reel]);

	const toggleLike = async () => {
		if (!reel) return;
		if (!user) {
			setLikeError('Sign in to like reels');
			return;
		}

		const previous = likes[reel.id];
		// Optimistic — the server response replaces it either way.
		setLikes((prev) => ({
			...prev,
			[reel.id]: {
				liked: !previous?.liked,
				count: (previous?.count || 0) + (previous?.liked ? -1 : 1),
			},
		}));

		try {
			const res = await fetch(`/api/reels/${reel.id}/like`, { method: 'POST' });
			if (!res.ok) throw new Error('Failed');
			const data = (await res.json()) as { liked: boolean; like_count: number };
			setLikes((prev) => ({
				...prev,
				[reel.id]: { liked: data.liked, count: data.like_count },
			}));
			setLikeError(null);
		} catch {
			setLikes((prev) => ({ ...prev, [reel.id]: previous }));
			setLikeError('Could not update your like');
		}
	};

	if (!reel) return null;

	const like = likes[reel.id] || { liked: false, count: 0 };

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
			<button
				aria-label="Close reels"
				className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20"
				onClick={onClose}
				type="button"
			>
				<CloseIcon color="#FFFFFF" size={22} />
			</button>

			<div className="relative w-full h-full lg:h-[86vh] lg:w-auto flex flex-col lg:flex-row lg:gap-4 lg:items-stretch">
				{/* Player */}
				<div
					className="relative flex-1 lg:flex-none lg:h-full bg-black lg:rounded-2xl overflow-hidden"
					onTouchEnd={(e) => {
						if (touchStartY.current === null) return;
						const delta = touchStartY.current - e.changedTouches[0].clientY;
						if (Math.abs(delta) > 60) go(delta > 0 ? 1 : -1);
						touchStartY.current = null;
					}}
					onTouchStart={(e) => {
						touchStartY.current = e.touches[0].clientY;
					}}
					onWheel={(e) => {
						if (wheelLock.current || Math.abs(e.deltaY) < 20) return;
						wheelLock.current = true;
						go(e.deltaY > 0 ? 1 : -1);
						setTimeout(() => {
							wheelLock.current = false;
						}, 500);
					}}
					style={{ aspectRatio: '9 / 16' }}
				>
					<video
						className="w-full h-full object-contain bg-black"
						controls
						key={reel.id}
						loop
						playsInline
						poster={reel.thumbnail_url || undefined}
						ref={videoRef}
						src={reel.video_url}
					/>

					{/* Seller strip */}
					<div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
						<div className="flex items-center gap-2.5 pointer-events-auto">
							<div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0">
								{reel.seller_photo ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										alt={reel.seller_name}
										className="w-full h-full object-cover"
										src={reel.seller_photo}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-white text-[13px] font-bold">
										{reel.seller_name?.charAt(0).toUpperCase()}
									</div>
								)}
							</div>
							<div className="min-w-0">
								{reel.seller_handle ? (
									<a
										className="text-white text-[13.5px] font-semibold hover:underline block truncate"
										href={`/sellers/${reel.seller_handle}`}
									>
										{reel.seller_name}
									</a>
								) : (
									<span className="text-white text-[13.5px] font-semibold block truncate">
										{reel.seller_name}
									</span>
								)}
								<span className="text-white/70 text-[11.5px]">
									{reel.view_count} views
								</span>
							</div>
						</div>
					</div>

					{/* Caption */}
					{(reel.title || reel.description) && (
						<div className="absolute bottom-0 inset-x-0 p-4 pb-14 bg-gradient-to-t from-black/80 to-transparent">
							{reel.title && (
								<p className="text-white text-[14px] font-semibold">{reel.title}</p>
							)}
							{reel.description && (
								<p className="text-white/80 text-[12.5px] mt-0.5 line-clamp-3">
									{reel.description}
								</p>
							)}
						</div>
					)}

					{/* Prev / next */}
					{index > 0 && (
						<button
							aria-label="Previous reel"
							className="hidden lg:flex absolute -left-14 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20"
							onClick={() => go(-1)}
							type="button"
						>
							<ArrowUpIcon color="#FFFFFF" size={20} />
						</button>
					)}
					{index < reels.length - 1 && (
						<button
							aria-label="Next reel"
							className="hidden lg:flex absolute -left-14 top-1/2 translate-y-8 p-2.5 rounded-full bg-white/10 hover:bg-white/20"
							onClick={() => go(1)}
							type="button"
						>
							<ArrowDownIcon color="#FFFFFF" size={20} />
						</button>
					)}
				</div>

				{/* Side panel: like action + live chat with the seller */}
				<div className="lg:w-[380px] bg-white lg:rounded-2xl flex flex-col overflow-hidden h-[45vh] lg:h-full">
					<div
						className="flex items-center gap-2 p-3 border-b"
						style={{ borderColor: '#EDEAE3' }}
					>
						<button
							className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-semibold"
							onClick={toggleLike}
							style={{
								borderColor: like.liked ? '#432C63' : '#EDEAE3',
								color: like.liked ? '#432C63' : '#404040',
							}}
							type="button"
						>
							{like.liked ? (
								<HeartFilledIcon color="#432C63" size={17} />
							) : (
								<HeartIcon color="#404040" size={17} />
							)}
							{like.count}
						</button>

						<span className="ml-auto flex items-center gap-1.5 text-[12.5px] font-medium text-[#737373]">
							<MessageIcon color="#737373" size={15} />
							Message the seller below
						</span>
					</div>

					{likeError && (
						<p className="px-3 py-1.5 text-[12px] text-red-600">{likeError}</p>
					)}

					<div className="flex-1 min-h-0">
						{user ? (
							// Keyed by reel so switching reels re-opens the conversation
							// with the newly-selected seller.
							<ChatBox
								key={reel.id}
								sellerId={reel.seller_id}
								sellerName={reel.seller_name}
								subject={reel.title || 'Reel'}
							/>
						) : (
							<div className="h-full flex flex-col items-center justify-center text-center px-6">
								<MessageIcon color="#432C63" size={28} />
								<p className="mt-3 text-[14px] font-semibold text-[#1B1B1B]">
									Message this seller
								</p>
								<p className="mt-1 text-[13px]" style={{ color: '#737373' }}>
									Sign in to chat with {reel.seller_name} about this reel
								</p>
								<a
									className="mt-4 px-4 py-2 rounded-full text-[13px] font-semibold text-white"
									href="/user"
									style={{ backgroundColor: '#432C63' }}
								>
									Sign in
								</a>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
