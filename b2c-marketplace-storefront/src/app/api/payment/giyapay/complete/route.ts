import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	console.log('[GiyaPay Complete] API route called');
	try {
		const { cartId } = await request.json();
		console.log('[GiyaPay Complete] Received cartId:', cartId);

		if (!cartId) {
			return NextResponse.json(
				{ error: 'Cart ID is required' },
				{ status: 400 },
			);
		}

		console.log('[GiyaPay Complete] Processing cart:', cartId);

		// Also try to get the current cart from cookies as fallback
		const { getCartId } = await import('@/lib/data/cookies');
		const currentCartId = await getCartId();

		console.log('[GiyaPay Complete] Cart ID from GiyaPay:', cartId);
		console.log('[GiyaPay Complete] Cart ID from cookies:', currentCartId);

		// Use current cart if the GiyaPay cart doesn't exist
		const finalCartId = cartId;
		if (currentCartId && currentCartId !== cartId) {
			console.log('[GiyaPay Complete] Will try both cart IDs');
		}

		try {
			// First, let's debug the cart state
			console.log('[GiyaPay Complete] Debugging cart state...');

			// Import SDK and get cart details
			console.log('[GiyaPay Complete] Importing SDK...');
			const { sdk } = await import('@/lib/config');
			console.log(
				'[GiyaPay Complete] SDK imported, importing auth headers...',
			);
			const { getAuthHeaders } = await import('@/lib/data/cookies');
			console.log('[GiyaPay Complete] Auth headers imported');

			const headers = await getAuthHeaders();
			const hasAuth = 'authorization' in headers;
			console.log(
				'[GiyaPay Complete] Auth headers available:',
				hasAuth,
			);

			// Get cart details to debug
			let cart = null;
			let workingCartId = finalCartId;

			// Try the GiyaPay cart ID first
			try {
				// First try with the same fields format as the working calls
				cart = await sdk.store.cart.retrieve(
					finalCartId,
					{
						fields: '*items,*region,*items.product,*items.variant,*items.variant.options,items.variant.options.option.title,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name',
					},
					headers,
				);
				// Check if cart data is wrapped in a 'cart' property
				const actualCart = cart?.cart || cart;
				console.log(
					'[GiyaPay Complete] Cart retrieved with GiyaPay ID (detailed fields):',
					{
						actualCartKeys: Object.keys(actualCart || {}),
						cartKeys: Object.keys(cart || {}),
						currency: actualCart?.currency_code,
						hasItems:
							!!actualCart?.items && actualCart.items.length > 0,
						id: actualCart?.id,
						isWrapped: !!cart?.cart,
						itemsCount: actualCart?.items?.length || 0,
						paymentStatus: actualCart?.payment_collection?.status,
						rawCart: actualCart?.items
							? 'items present'
							: 'no items field',
						total: actualCart?.total,
					},
				);
				// Use the actual cart data
				cart = actualCart;
			} catch (cartError) {
				console.log(
					'[GiyaPay Complete] GiyaPay cart retrieval failed:',
					cartError instanceof Error ? cartError.message : String(cartError),
				);
				cart = null; // Ensure cart is null so we try the cookie cart
			}

			// If GiyaPay cart failed or has no items, try the cookie cart
			const cartHasItems = cart && 'items' in cart && Array.isArray(cart.items) && cart.items.length > 0;
			if (
				(!cart || !cartHasItems) &&
				currentCartId &&
				currentCartId !== finalCartId
			) {
				console.log('[GiyaPay Complete] Trying cookie cart...');

				try {
					cart = await sdk.store.cart.retrieve(
						currentCartId,
						{
							fields: '*items,*region,*items.product,*items.variant,*items.variant.options,items.variant.options.option.title,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name',
						},
						headers,
					);
					workingCartId = currentCartId;
					// Check if cart data is wrapped in a 'cart' property
					const actualCart = cart?.cart || cart;
					console.log(
						'[GiyaPay Complete] Cart retrieved with cookie ID (detailed fields):',
						{
							actualCartKeys: Object.keys(actualCart || {}),
							cartKeys: Object.keys(cart || {}),
							currency: actualCart?.currency_code,
							hasItems:
								!!actualCart?.items &&
								actualCart.items.length > 0,
							id: actualCart?.id,
							isWrapped: !!cart?.cart,
							itemsCount: actualCart?.items?.length || 0,
							paymentStatus:
								actualCart?.payment_collection?.status,
							rawCart: actualCart?.items
								? 'items present'
								: 'no items field',
							total: actualCart?.total,
						},
					);
					// Use the actual cart data
					cart = actualCart;
				} catch (cookieCartError) {
					console.error(
						'[GiyaPay Complete] Cookie cart also failed:',
						cookieCartError instanceof Error ? cookieCartError.message : String(cookieCartError),
					);
				}
			}

			// If still no cart with items, try once more without fields to see what we get
			const cartHasItemsAfterRetry = cart && 'items' in cart && Array.isArray(cart.items) && cart.items.length > 0;
			if (!cart || !cartHasItemsAfterRetry) {
				console.log(
					'[GiyaPay Complete] Trying basic cart retrieval without fields...',
				);
				try {
					// Try the current cart (cookie) without fields
					if (currentCartId) {
						const basicCart = await sdk.store.cart.retrieve(
							currentCartId,
							{},
							headers,
						);
						const actualBasicCart = basicCart?.cart || basicCart;
						console.log(
							'[GiyaPay Complete] Basic cart without fields:',
							{
								actualKeys: Object.keys(actualBasicCart || {}),
								hasItemsField:
									'items' in (actualBasicCart || {}),
								id: actualBasicCart?.id,
								isWrapped: !!basicCart?.cart,
								itemsValue: actualBasicCart?.items,
								keys: Object.keys(basicCart || {}),
							},
						);
					}
				} catch (basicError) {
					console.log(
						'[GiyaPay Complete] Basic cart retrieval also failed:',
						basicError instanceof Error ? basicError.message : String(basicError),
					);
				}

				console.error(
					'[GiyaPay Complete] No valid cart found with items!',
				);
				console.log('[GiyaPay Complete] Final cart state:', {
					cartExists: !!cart,
					cookieCartId: currentCartId,
					giyaPayCartId: finalCartId,
					hasItems: (cart && 'items' in cart && Array.isArray(cart.items)) ? cart.items.length : 0,
				});
				return NextResponse.json(
					{ error: 'Cart is empty or invalid' },
					{ status: 400 },
				);
			}

			// Try to complete the cart
			console.log(
				'[GiyaPay Complete] Attempting cart completion with ID:',
				workingCartId,
			);

			try {
				// Use direct SDK call instead of placeOrder to avoid redirect
				const result = await sdk.store.cart.complete(
					workingCartId,
					{},
					headers,
				);
				// Handle different response types from cart.complete
				const orderSet = 'order_set' in result && result.order_set && typeof result.order_set === 'object' ? result.order_set : null;
				const orders = orderSet && typeof orderSet === 'object' && 'orders' in orderSet && orderSet.orders ? orderSet.orders : null;
				const firstOrder = Array.isArray(orders) && orders.length > 0 ? orders[0] : null;
				const orderId = firstOrder && typeof firstOrder === 'object' && 'id' in firstOrder ? firstOrder.id : null;

				console.log('[GiyaPay Complete] Place order result:', {
					orderCount: Array.isArray(orders) ? orders.length : 0,
					orderId,
					success: !!firstOrder,
				});

				if (orderId) {
					// Clear cart cookie manually (since we're not using placeOrder)
					const { removeCartId } = await import('@/lib/data/cookies');
					await removeCartId();

					return NextResponse.json({
						message: 'Order placed successfully',
						orderId,
						success: true,
					});
				} else {
					return NextResponse.json(
						{ error: 'Order creation failed', result },
						{ status: 500 },
					);
				}
			} catch (completeError) {
				console.error(
					'[GiyaPay Complete] Error completing cart:',
					completeError,
				);
				return NextResponse.json(
					{
						details:
							completeError instanceof Error
								? completeError.message
								: 'Unknown error',
						error: 'Failed to complete cart',
					},
					{ status: 500 },
				);
			}
		} catch (debugError) {
			console.error('[GiyaPay Complete] Debug error:', debugError);
			return NextResponse.json(
				{
					details:
						debugError instanceof Error
							? debugError.message
							: 'Unknown error',
					error: 'Failed to process cart',
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error('[GiyaPay Complete] Request error:', error);
		return NextResponse.json(
			{
				details:
					error instanceof Error ? error.message : 'Unknown error',
				error: 'Invalid request',
			},
			{ status: 400 },
		);
	}
}
