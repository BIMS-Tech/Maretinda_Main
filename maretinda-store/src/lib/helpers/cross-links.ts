const PRODUCTION_SELLER_PANEL = 'https://seller.maretinda.com';

/** The seller panel, falling back to production when the build doesn't say. */
export const sellerPanelUrl = (panelUrl: string | undefined) => (panelUrl || PRODUCTION_SELLER_PANEL).replace(/\/+$/, '');

export const sellerRegisterUrl = (panelUrl: string | undefined) => `${sellerPanelUrl(panelUrl)}/register`;

// Next.js inlines NEXT_PUBLIC_* only where they're spelled out like this
export const SELLER_PANEL_URL = sellerPanelUrl(process.env.NEXT_PUBLIC_seller_PANEL_URL);
export const SELLER_REGISTER_URL = `${SELLER_PANEL_URL}/register`;

/** Social profiles that are configured; the footer hides the rest instead of linking to "#". */
export const socialLinks = (urls: { facebook?: string; instagram?: string; tiktok?: string }) =>
	(
		[
			{ label: 'Facebook', href: urls.facebook },
			{ label: 'Instagram', href: urls.instagram },
			{ label: 'TikTok', href: urls.tiktok },
		] as const
	)
		.filter((link): link is { label: typeof link.label; href: string } => Boolean(link.href))
		.map(({ label, href }) => ({ label, href }));

export const SOCIAL_LINKS = socialLinks({
	facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
	instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
	tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL,
});
