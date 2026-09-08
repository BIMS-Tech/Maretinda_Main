import { getAuthHeaders } from '@/lib/data/cookies';

/**
 * SSE proxy for the support assistant.
 *
 * The customer's Medusa JWT lives in an httpOnly cookie, so the browser cannot
 * attach it to a cross-origin request itself. This route reads the cookie
 * server-side, forwards it to the Medusa backend, and pipes the event stream
 * straight back — the token never reaches client JS, and the widget makes a
 * same-origin call with no CORS setup.
 *
 * All retrieval, tool use, and generation happen in the backend
 * (backend/src/api/store/assistant). This is pass-through only.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDUSA_BACKEND_URL =
	process.env.MEDUSA_BACKEND_URL ||
	process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
	'http://localhost:9000';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ message: 'Invalid JSON body' }, { status: 400 });
	}

	const authHeaders = (await getAuthHeaders()) as { authorization?: string };

	let upstream: Response;
	try {
		upstream = await fetch(`${MEDUSA_BACKEND_URL}/store/assistant`, {
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				'x-publishable-api-key': PUBLISHABLE_KEY,
				...(authHeaders.authorization
					? { authorization: authHeaders.authorization }
					: {}),
			},
			method: 'POST',
			// Forward the abort so closing the widget mid-answer stops the
			// backend's model call instead of leaving it streaming to nobody.
			signal: request.signal,
		});
	} catch {
		return Response.json(
			{ message: 'The assistant is unavailable right now.' },
			{ status: 502 },
		);
	}

	// Errors come back as JSON (rate limit, validation) — pass them through as-is
	// so the widget can show the real message rather than a generic failure.
	if (!upstream.ok || !upstream.body) {
		const text = await upstream.text().catch(() => '');
		return new Response(text || '{"message":"Assistant error"}', {
			headers: { 'Content-Type': 'application/json' },
			status: upstream.status,
		});
	}

	return new Response(upstream.body, {
		headers: {
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'Content-Type': 'text/event-stream',
			'X-Accel-Buffering': 'no',
		},
	});
}
