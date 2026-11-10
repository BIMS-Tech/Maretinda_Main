/**
 * Headers that tell the backend which buyer a server-side sign-in or sign-up
 * is for. The store calls the backend from its own server, so without them
 * every buyer shares the store's address and its rate limits. The backend only
 * trusts the address alongside STORE_SERVER_SECRET.
 */
export const forwardedAuthHeaders = (incoming: Headers, secret: string | undefined): Record<string, string> => {
	const ip =
		incoming.get('cf-connecting-ip')?.trim() ||
		incoming.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		incoming.get('x-real-ip')?.trim();
	if (!secret || !ip) return {};
	return { 'x-maretinda-client-ip': ip, 'x-maretinda-store-secret': secret };
};
