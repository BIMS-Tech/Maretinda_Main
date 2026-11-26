/**
 * Who a session token belongs to, without checking its signature: the token
 * comes straight from our backend, which checks it on every call.
 */
export const tokenPayload = (token: string | null | undefined): Record<string, unknown> => {
	const body = token?.split('.')[1];
	if (!body) return {};
	try {
		const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
		return payload && typeof payload === 'object' ? payload : {};
	} catch {
		return {};
	}
};

/**
 * Whether a token opens a shopper account. The backend checks a password
 * without looking at the account type, so a seller's password is answered with
 * a token that belongs to no shopper: keeping it as the session left people
 * half signed in, bounced back to an empty sign-in form.
 */
export const isShopperToken = (token: string | null | undefined): boolean => {
	const { actor_id, actor_type } = tokenPayload(token);
	return typeof actor_id === 'string' && actor_id.length > 0 && (actor_type === undefined || actor_type === 'customer');
};
