import { type NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, any> {
	try {
		const [, payloadB64] = token.split('.');
		return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
	} catch {
		return {};
	}
}

function buildSetCookie(token: string, secure: boolean): string {
	const parts = [
		`_medusa_jwt=${token}`,
		`HttpOnly`,
		`Path=/`,
		`Max-Age=${60 * 60 * 24 * 7}`,
		`SameSite=Lax`,
	];
	if (secure) parts.push('Secure');
	return parts.join('; ');
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');
	const state = searchParams.get('state');
	const error = searchParams.get('error');

	const baseUrl = new URL(request.url).origin;
	const secure = process.env.NODE_ENV === 'production';

	const failRedirect = (reason: string) =>
		new Response(null, {
			headers: { Location: `${baseUrl}/login?error=${reason}` },
			status: 302,
		});

	if (error) return failRedirect('google_auth_failed');
	if (!code || !state) return failRedirect('missing_params');

	try {
		const backendUrl =
			process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
		const publishableKey =
			process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';

		// Exchange Google code for Medusa JWT
		const callbackRes = await fetch(
			`${backendUrl}/auth/customer/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
			{
				headers: {
					'Content-Type': 'application/json',
					'x-publishable-api-key': publishableKey,
				},
				method: 'GET',
			},
		);

		if (!callbackRes.ok) return failRedirect('auth_failed');

		const { token } = await callbackRes.json();
		if (!token) return failRedirect('no_token');

		const authHeaders = {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'x-publishable-api-key': publishableKey,
		};

		// Check if customer record exists; create it if this is a first-time login
		const customerCheckRes = await fetch(
			`${backendUrl}/store/customers/me`,
			{ headers: authHeaders, method: 'GET' },
		);

		if (!customerCheckRes.ok) {
			const payload = decodeJwtPayload(token);
			const meta = payload?.user_metadata ?? {};

			await fetch(`${backendUrl}/store/customers`, {
				body: JSON.stringify({
					email: meta.email ?? '',
					first_name: meta.given_name ?? meta.name?.split(' ')[0] ?? '',
					last_name:
						meta.family_name ??
						meta.name?.split(' ').slice(1).join(' ') ??
						'',
				}),
				headers: authHeaders,
				method: 'POST',
			});
		}

		// Use a plain Response with Set-Cookie header so the cookie is reliably sent
		return new Response(null, {
			headers: {
				'Location': `${baseUrl}/user`,
				'Set-Cookie': buildSetCookie(token, secure),
			},
			status: 302,
		});
	} catch (err) {
		console.error('[google-callback] Error:', err);
		return failRedirect('server_error');
	}
}
