/**
 * Only follow ?returnTo= to a path on this site. Otherwise a crafted login link
 * like /login?returnTo=https://evil.example sends the shopper to a lookalike page
 * right after they sign in, when they least expect it.
 */
export const safeReturnTo = (returnTo: string | null | undefined, fallback: string) => {
	if (!returnTo?.startsWith('/')) return fallback;
	// "//evil.example" and "/\evil.example" are protocol-relative to a browser.
	if (returnTo.startsWith('//') || returnTo.startsWith('/\\')) return fallback;
	// Browsers strip tabs and newlines inside URLs, so "/\t/evil.example" becomes "//evil.example".
	// biome-ignore lint/suspicious/noControlCharactersInRegex: that is what this rejects
	if (/[\u0000-\u001f]/.test(returnTo)) return fallback;
	return returnTo;
};

/** The login page, carrying on to where the shopper was going if that's on this site. */
export const loginPath = (returnTo: string | null | undefined) => {
	const target = safeReturnTo(returnTo, '');
	return target ? `/login?returnTo=${encodeURIComponent(target)}` : '/login';
};
