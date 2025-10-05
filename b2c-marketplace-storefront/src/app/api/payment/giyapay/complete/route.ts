import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('[GiyaPay Complete] API route called')
  try {
    const { cartId } = await request.json()
    console.log('[GiyaPay Complete] Received cartId:', cartId)
    
    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      )
    }

    console.log('[GiyaPay Complete] Processing cart:', cartId)
    
    // Also try to get the current cart from cookies as fallback
    const { getCartId } = await import('@/lib/data/cookies')
    const currentCartId = await getCartId()
    
    console.log('[GiyaPay Complete] Cart ID from GiyaPay:', cartId)
    console.log('[GiyaPay Complete] Cart ID from cookies:', currentCartId)
    
    // Use current cart if the GiyaPay cart doesn't exist
    let finalCartId = cartId
    if (currentCartId && currentCartId !== cartId) {
      console.log('[GiyaPay Complete] Will try both cart IDs')
    }

    try {
      // First, let's debug the cart state
      console.log('[GiyaPay Complete] Debugging cart state...')
      
      // Import SDK and get cart details
      console.log('[GiyaPay Complete] Importing SDK...')
      const { sdk } = await import('@/lib/config')
      console.log('[GiyaPay Complete] SDK imported, importing auth headers...')
      const { getAuthHeaders } = await import('@/lib/data/cookies')
      console.log('[GiyaPay Complete] Auth headers imported')
      
      const headers = await getAuthHeaders()
      console.log('[GiyaPay Complete] Auth headers available:', !!headers.authorization)
      
      // Get cart details to debug
      let cart = null
      let workingCartId = finalCartId
      
      // Try the GiyaPay cart ID first
      try {
        // First try with the same fields format as the working calls
        cart = await sdk.store.cart.retrieve(finalCartId, {
          fields: "*items,*region,*items.product,*items.variant,*items.variant.options,items.variant.options.option.title,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name"
        }, headers)
        // Check if cart data is wrapped in a 'cart' property
        const actualCart = cart?.cart || cart
        console.log('[GiyaPay Complete] Cart retrieved with GiyaPay ID (detailed fields):', {
          id: actualCart?.id,
          itemsCount: actualCart?.items?.length || 0,
          paymentStatus: actualCart?.payment_collection?.status,
          hasItems: !!actualCart?.items && actualCart.items.length > 0,
          currency: actualCart?.currency_code,
          total: actualCart?.total,
          rawCart: !!actualCart?.items ? 'items present' : 'no items field',
          cartKeys: Object.keys(cart || {}),
          actualCartKeys: Object.keys(actualCart || {}),
          isWrapped: !!cart?.cart
        })
        // Use the actual cart data
        cart = actualCart
      } catch (cartError) {
        console.log('[GiyaPay Complete] GiyaPay cart retrieval failed:', cartError.message)
        cart = null // Ensure cart is null so we try the cookie cart
      }
      
      // If GiyaPay cart failed or has no items, try the cookie cart
      if ((!cart || !cart.items || cart.items.length === 0) && currentCartId && currentCartId !== finalCartId) {
        console.log('[GiyaPay Complete] Trying cookie cart...')
        
        try {
          cart = await sdk.store.cart.retrieve(currentCartId, {
            fields: "*items,*region,*items.product,*items.variant,*items.variant.options,items.variant.options.option.title,*items.thumbnail,*items.metadata,+items.total,*promotions,+shipping_methods.name"
          }, headers)
          workingCartId = currentCartId
          // Check if cart data is wrapped in a 'cart' property
          const actualCart = cart?.cart || cart
          console.log('[GiyaPay Complete] Cart retrieved with cookie ID (detailed fields):', {
            id: actualCart?.id,
            itemsCount: actualCart?.items?.length || 0,
            paymentStatus: actualCart?.payment_collection?.status,
            hasItems: !!actualCart?.items && actualCart.items.length > 0,
            currency: actualCart?.currency_code,
            total: actualCart?.total,
            rawCart: !!actualCart?.items ? 'items present' : 'no items field',
            cartKeys: Object.keys(cart || {}),
            actualCartKeys: Object.keys(actualCart || {}),
            isWrapped: !!cart?.cart
          })
          // Use the actual cart data
          cart = actualCart
        } catch (cookieCartError) {
          console.error('[GiyaPay Complete] Cookie cart also failed:', cookieCartError.message)
        }
      }
      
      // If still no cart with items, try once more without fields to see what we get
      if (!cart || !cart.items || cart.items.length === 0) {
        console.log('[GiyaPay Complete] Trying basic cart retrieval without fields...')
        try {
          // Try the current cart (cookie) without fields
          if (currentCartId) {
            const basicCart = await sdk.store.cart.retrieve(currentCartId, {}, headers)
            const actualBasicCart = basicCart?.cart || basicCart
            console.log('[GiyaPay Complete] Basic cart without fields:', {
              id: actualBasicCart?.id,
              keys: Object.keys(basicCart || {}),
              actualKeys: Object.keys(actualBasicCart || {}),
              hasItemsField: 'items' in (actualBasicCart || {}),
              itemsValue: actualBasicCart?.items,
              isWrapped: !!basicCart?.cart
            })
          }
        } catch (basicError) {
          console.log('[GiyaPay Complete] Basic cart retrieval also failed:', basicError.message)
        }
        
        console.error('[GiyaPay Complete] No valid cart found with items!')
        console.log('[GiyaPay Complete] Final cart state:', {
          cartExists: !!cart,
          hasItems: cart?.items?.length || 0,
          giyaPayCartId: finalCartId,
          cookieCartId: currentCartId
        })
        return NextResponse.json(
          { error: 'Cart is empty or invalid' },
          { status: 400 }
        )
      }
      
      // Try to complete the cart
      console.log('[GiyaPay Complete] Attempting cart completion with ID:', workingCartId)
      
      try {
        // Use direct SDK call instead of placeOrder to avoid redirect
        const result = await sdk.store.cart.complete(workingCartId, {}, headers)
        console.log('[GiyaPay Complete] Place order result:', {
          success: !!result?.order_set?.orders?.[0],
          orderId: result?.order_set?.orders?.[0]?.id,
          orderCount: result?.order_set?.orders?.length || 0
        })

        if (result?.order_set?.orders?.[0]?.id) {
          // Clear cart cookie manually (since we're not using placeOrder)
          const { removeCartId } = await import('@/lib/data/cookies')
          await removeCartId()
          
          return NextResponse.json({
            success: true,
            orderId: result.order_set.orders[0].id,
            message: 'Order placed successfully'
          })
        } else {
          return NextResponse.json(
            { error: 'Order creation failed', result },
            { status: 500 }
          )
        }

      } catch (completeError) {
        console.error('[GiyaPay Complete] Error completing cart:', completeError)
        return NextResponse.json(
          { 
            error: 'Failed to complete cart',
            details: completeError instanceof Error ? completeError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }

    } catch (debugError) {
      console.error('[GiyaPay Complete] Debug error:', debugError)
      return NextResponse.json(
        { 
          error: 'Failed to process cart',
          details: debugError instanceof Error ? debugError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[GiyaPay Complete] Request error:', error)
    return NextResponse.json(
      { 
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}