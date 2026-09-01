'use client';

import { useEffect, useState } from 'react';

import {
	type HelpVideo,
	type VideoAudience,
	PUBLISHED_VIDEOS,
	embedUrl,
	posterFallbackUrl,
	posterUrl,
} from './helpVideos';

const AUDIENCE_LABEL: Record<VideoAudience, string> = {
	customers: 'For customers',
	sellers: 'For sellers',
};

const PlayIcon = ({ size = 18 }: { size?: number }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
		<path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.6-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
	</svg>
);

export function VideoCard({ video, onPlay }: { video: HelpVideo; onPlay: (v: HelpVideo) => void }) {
	const [poster, setPoster] = useState(() => posterUrl(video));

	return (
		<button
			type="button"
			onClick={() => onPlay(video)}
			className="group text-left rounded-2xl border bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
			style={{ borderColor: '#EDEAE3' }}
			aria-label={`Play video: ${video.title}`}
		>
			<div className="relative aspect-video overflow-hidden" style={{ backgroundColor: '#2A1B3D' }}>
				<img
					src={poster}
					alt=""
					loading="lazy"
					// maxresdefault does not exist for every upload; fall back to hqdefault.
					onError={() => setPoster(posterFallbackUrl(video))}
					className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
				/>
				<div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)' }} />
				<div
					className="absolute inset-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
					aria-hidden
				>
					<span
						className="w-13 h-13 rounded-full flex items-center justify-center pl-0.5"
						style={{ width: '52px', height: '52px', backgroundColor: '#FFC533', color: '#432C63', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' }}
					>
						<PlayIcon size={20} />
					</span>
				</div>
				{video.duration ? (
					<span
						className="absolute bottom-2.5 right-2.5 text-[11px] font-bold px-2 py-0.5 rounded-md"
						style={{ backgroundColor: 'rgba(0,0,0,0.72)', color: 'white' }}
					>
						{video.duration}
					</span>
				) : null}
			</div>
			<div className="p-4">
				<span
					className="inline-block text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
					style={{ backgroundColor: '#F0EBF8', color: '#432C63' }}
				>
					{AUDIENCE_LABEL[video.audience]}
				</span>
				<h3 className="text-[14px] font-extrabold text-[#1B1B1B] leading-snug mb-1">{video.title}</h3>
				<p className="text-[12.5px] leading-snug" style={{ color: '#737373' }}>{video.description}</p>
			</div>
		</button>
	);
}

function VideoLightbox({ video, onClose }: { video: HelpVideo; onClose: () => void }) {
	// Close on Escape, and stop the page behind the overlay from scrolling.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKey);
		};
	}, [onClose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={video.title}
			onClick={onClose}
			className="fixed inset-0 z-[100] flex items-center justify-center p-4"
			style={{ backgroundColor: 'rgba(20, 12, 30, 0.82)', backdropFilter: 'blur(4px)' }}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-[900px]"
			>
				<div className="flex items-start justify-between gap-4 mb-3">
					<div>
						<h3 className="font-serif text-white text-[19px] lg:text-[22px] tracking-[-0.01em]">{video.title}</h3>
						<p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.62)' }}>{video.description}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close video"
						className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
						style={{ backgroundColor: 'rgba(255,255,255,0.14)', color: 'white' }}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div className="relative aspect-video rounded-2xl overflow-hidden" style={{ backgroundColor: '#000' }}>
					<iframe
						src={embedUrl(video)}
						title={video.title}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
						className="absolute inset-0 w-full h-full"
						style={{ border: 0 }}
					/>
				</div>
			</div>
		</div>
	);
}

type Tab = 'all' | VideoAudience;

const TABS: { id: Tab; label: string }[] = [
	{ id: 'all', label: 'All videos' },
	{ id: 'customers', label: 'For customers' },
	{ id: 'sellers', label: 'For sellers' },
];

export function VideoLibrary({ heading, subheading }: { heading: string; subheading: string }) {
	const [tab, setTab] = useState<Tab>('all');
	const [playing, setPlaying] = useState<HelpVideo | null>(null);

	// Nothing uploaded yet — render nothing rather than an empty shelf.
	if (PUBLISHED_VIDEOS.length === 0) return null;

	const shown = tab === 'all' ? PUBLISHED_VIDEOS : PUBLISHED_VIDEOS.filter((v) => v.audience === tab);
	// Hide a tab filter that no video would match.
	const tabs = TABS.filter((t) => t.id === 'all' || PUBLISHED_VIDEOS.some((v) => v.audience === t.id));

	return (
		<div className="mb-12">
			<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
				<div>
					<div className="flex items-center gap-2 mb-1.5">
						<span
							className="w-6 h-6 rounded-lg flex items-center justify-center"
							style={{ backgroundColor: '#F0EBF8', color: '#432C63' }}
						>
							<PlayIcon size={12} />
						</span>
						<h2 className="font-serif text-[#1B1B1B] text-[22px] tracking-[-0.01em]">{heading}</h2>
					</div>
					<p className="text-[13.5px]" style={{ color: '#737373' }}>{subheading}</p>
				</div>

				{tabs.length > 1 ? (
					<div className="flex gap-1.5 p-1 rounded-full self-start" style={{ backgroundColor: '#F1EDE6' }}>
						{tabs.map((t) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setTab(t.id)}
								className="h-8 px-4 rounded-full text-[12.5px] font-bold transition-colors"
								style={
									tab === t.id
										? { backgroundColor: '#432C63', color: 'white' }
										: { color: '#6B6B6B' }
								}
							>
								{t.label}
							</button>
						))}
					</div>
				) : null}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{shown.map((video) => (
					<VideoCard key={video.id} video={video} onPlay={setPlaying} />
				))}
			</div>

			{playing ? <VideoLightbox video={playing} onClose={() => setPlaying(null)} /> : null}
		</div>
	);
}

/**
 * A bare grid of videos with its own player — used for search-result matches,
 * where the audience tabs and section heading would be noise.
 */
export function VideoResults({ videos }: { videos: HelpVideo[] }) {
	const [playing, setPlaying] = useState<HelpVideo | null>(null);
	if (videos.length === 0) return null;
	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{videos.map((video) => (
					<VideoCard key={video.id} video={video} onPlay={setPlaying} />
				))}
			</div>
			{playing ? <VideoLightbox video={playing} onClose={() => setPlaying(null)} /> : null}
		</>
	);
}
