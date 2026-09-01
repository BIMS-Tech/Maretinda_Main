/**
 * Help Center video tutorials.
 *
 * ── HOW TO ADD A VIDEO ────────────────────────────────────────────────
 * 1. Upload the clip to the Maretinda YouTube channel as **Unlisted**
 *    (Unlisted = anyone with the link can watch, but it never shows up in
 *    YouTube search or on the channel page).
 * 2. Copy the ID out of the share link — it is the part after `youtu.be/`
 *    or after `watch?v=`:
 *        https://youtu.be/dQw4w9WgXcQ        ->  dQw4w9WgXcQ
 *        https://youtube.com/watch?v=dQw4w9WgXcQ  ->  dQw4w9WgXcQ
 * 3. Paste it into `youtubeId` below and fill in the other fields.
 *
 * Entries with an empty `youtubeId` are skipped, so it is safe to leave a
 * placeholder row here until the clip is actually uploaded. If every entry
 * is empty the whole video section disappears from the page.
 * ──────────────────────────────────────────────────────────────────────
 */

/** Which side of the marketplace a video is aimed at. Drives the tab filter. */
export type VideoAudience = 'customers' | 'sellers';

export type HelpVideo = {
	/** Stable slug — also used for deep links, e.g. /help-center#video-first-order */
	id: string;
	/** YouTube video ID (not the full URL). Empty string = not uploaded yet. */
	youtubeId: string;
	title: string;
	description: string;
	/** Runtime as shown on the card, e.g. '3:12'. Leave blank to hide the badge. */
	duration: string;
	audience: VideoAudience;
	/**
	 * Optional custom poster image. Leave undefined to use YouTube's own
	 * thumbnail, which is what you want in almost every case.
	 */
	thumbnail?: string;
};

export const HELP_VIDEOS: HelpVideo[] = [
	{
		id: 'first-order',
		youtubeId: '',
		title: 'How to make your first order',
		description:
			'From finding a product to choosing COD or GCash at checkout — the whole flow in a few minutes.',
		duration: '',
		audience: 'customers',
	},
	{
		id: 'seller-onboarding',
		youtubeId: '',
		title: 'How to onboard as a seller',
		description:
			'Create your shop, pick a subscription plan, and get your storefront ready for its first sale.',
		duration: '',
		audience: 'sellers',
	},
	{
		id: 'business-documents',
		youtubeId: '',
		title: 'How to upload your business documents',
		description:
			'Which documents Maretinda needs for verification, how to upload them, and what happens next.',
		duration: '',
		audience: 'sellers',
	},
];

/** Only the videos that actually have a clip attached. */
export const PUBLISHED_VIDEOS = HELP_VIDEOS.filter((v) => v.youtubeId.trim().length > 0);

/** Poster frame for a card. YouTube always serves hqdefault; maxres can 404. */
export const posterUrl = (video: HelpVideo) =>
	video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`;

export const posterFallbackUrl = (video: HelpVideo) =>
	`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

/**
 * Privacy-enhanced embed — youtube-nocookie.com does not set tracking cookies
 * until the viewer actually presses play.
 */
export const embedUrl = (video: HelpVideo) =>
	`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

/** Free-text match over the published videos, used by the Help Center search box. */
export const searchVideos = (query: string) => {
	const q = query.trim().toLowerCase();
	if (q.length < 2) return [];
	return PUBLISHED_VIDEOS.filter(
		(v) =>
			v.title.toLowerCase().includes(q) ||
			v.description.toLowerCase().includes(q) ||
			v.audience.includes(q)
	);
};
