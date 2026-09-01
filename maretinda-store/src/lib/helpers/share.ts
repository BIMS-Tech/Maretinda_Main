export interface ShareTarget {
	id: string;
	label: string;
	href: string;
	/** Brand colour used to tint the icon. */
	color: string;
	/** When true the target only resolves inside a native app (deep link). */
	appOnly?: boolean;
}

export interface ShareContent {
	url: string;
	title: string;
	/** Optional formatted price, appended to the message where the network allows it. */
	price?: string;
	/** Absolute image URL — required for a Pinterest pin to carry the product photo. */
	image?: string;
}

/** Facebook Messenger web dialog needs the app's public id; it's absent until configured. */
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

/**
 * Builds the message that accompanies the link on networks that support one.
 * Facebook, Messenger and LinkedIn are deliberately excluded from captions:
 * they ignore any text passed by the sharer and read the Open Graph tags off
 * the product page instead.
 */
const buildMessage = ({ title, price }: Omit<ShareContent, 'url'>) =>
	price ? `${title} - ${price}` : title;

export const buildShareTargets = ({
	url,
	title,
	price,
	image,
}: ShareContent): ShareTarget[] => {
	const encodedUrl = encodeURIComponent(url);
	const message = buildMessage({ price, title });
	const encodedMessage = encodeURIComponent(message);

	const targets: ShareTarget[] = [
		{
			color: '#1877F2',
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
			id: 'facebook',
			label: 'Facebook',
		},
	];

	// Messenger's web dialog is unusable without an app id, so only offer it
	// once one is configured. Mobile users reach Messenger via the OS share
	// sheet regardless of this.
	if (FACEBOOK_APP_ID) {
		targets.push({
			color: '#0084FF',
			href: `https://www.facebook.com/dialog/send?app_id=${FACEBOOK_APP_ID}&link=${encodedUrl}&redirect_uri=${encodedUrl}`,
			id: 'messenger',
			label: 'Messenger',
		});
	}

	targets.push(
		{
			color: '#000000',
			href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`,
			id: 'x',
			label: 'X',
		},
		{
			color: '#25D366',
			href: `https://api.whatsapp.com/send?text=${encodeURIComponent(
				`${message} ${url}`,
			)}`,
			id: 'whatsapp',
			label: 'WhatsApp',
		},
		{
			appOnly: true,
			color: '#7360F2',
			href: `viber://forward?text=${encodeURIComponent(`${message} ${url}`)}`,
			id: 'viber',
			label: 'Viber',
		},
		{
			color: '#229ED9',
			href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
			id: 'telegram',
			label: 'Telegram',
		},
		{
			color: '#0A66C2',
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
			id: 'linkedin',
			label: 'LinkedIn',
		},
		{
			color: '#E60023',
			href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedMessage}${
				image ? `&media=${encodeURIComponent(image)}` : ''
			}`,
			id: 'pinterest',
			label: 'Pinterest',
		},
		{
			color: '#6B7280',
			href: `mailto:?subject=${encodedMessage}&body=${encodeURIComponent(
				`${message}\n\n${url}`,
			)}`,
			id: 'email',
			label: 'Email',
		},
	);

	return targets;
};

/**
 * Strips tracking/filter query params so shared links stay clean, while keeping
 * the variant selection that the sharer is actually looking at.
 */
export const buildShareUrl = (variantParams?: Record<string, string>) => {
	if (typeof window === 'undefined') return '';

	const shareUrl = new URL(window.location.pathname, window.location.origin);

	Object.entries(variantParams || {}).forEach(([key, value]) => {
		if (value) shareUrl.searchParams.set(key, value);
	});

	return shareUrl.toString();
};
