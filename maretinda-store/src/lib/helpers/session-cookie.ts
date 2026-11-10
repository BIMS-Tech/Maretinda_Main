/**
 * Options for the sign-in and cart cookies. SameSite is lax, not strict:
 * buyers come back from GiyaPay's site after paying, and a strict cookie is
 * withheld on that arrival, so the page rendered signed out (the header's
 * Account link went to the login page) until a refresh. Lax still keeps the
 * cookie off other sites' form posts and background requests, and Next.js
 * checks the origin of server actions.
 */
export const sessionCookieOptions = (days: number) => ({
	httpOnly: true,
	maxAge: 60 * 60 * 24 * days,
	path: '/',
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
});
