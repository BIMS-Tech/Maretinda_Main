import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const { callbackUrl, params } = await request.json();

		console.log('[GiyaPay Callback Proxy] Calling backend:', callbackUrl);

		// Make request to backend
		const response = await fetch(callbackUrl, {
			method: 'GET',
			redirect: 'manual', // Don't follow redirects
		});

		console.log(
			'[GiyaPay Callback Proxy] Backend response status:',
			response.status,
		);

		if (response.status === 302 || response.status === 301) {
			// Backend is redirecting, get the location
			const location = response.headers.get('location');
			console.log(
				'[GiyaPay Callback Proxy] Backend redirect location:',
				location,
			);

			if (
				location &&
				location.includes('/order/') &&
				location.includes('/confirmed')
			) {
				// Extract order ID from redirect URL
				const orderIdMatch = location.match(
					/\/order\/([^/]+)\/confirmed/,
				);
				if (orderIdMatch) {
					const orderId = orderIdMatch[1];
					return NextResponse.json({
						orderId: orderId,
						redirectUrl: location,
						success: true,
					});
				}
			}
		}

		// If no redirect or order ID found, return the params for manual handling
		return NextResponse.json({
			params: params,
			success: false,
		});
	} catch (error) {
		console.error('[GiyaPay Callback Proxy] Error:', error);
		return NextResponse.json(
			{
				details:
					error instanceof Error ? error.message : 'Unknown error',
				error: 'Failed to process callback',
			},
			{ status: 500 },
		);
	}
}
