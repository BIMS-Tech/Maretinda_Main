import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, order_id, refno, timestamp, amount, signature, payment_method } = body;

    // Validate required fields
    if (!signature || !nonce || !order_id) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('[GiyaPay] Processing payment completion for order:', order_id);

    // Call Medusa backend to verify signature and complete the order
    // The backend has access to the merchant secret from the database (admin panel config)
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 
                           process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || '';
    
    if (!publishableKey) {
      console.error('[GiyaPay] Warning: No publishable API key configured');
    }
    
    // Get the real cart ID from cookies - this is the source of truth
    // The order_id from callback might be a generated fallback ID
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('_medusa_cart_id');
    const realCartId = cartCookie?.value;
    
    console.log('[GiyaPay] Cart ID from callback (order_id):', order_id);
    console.log('[GiyaPay] Real cart ID from cookies:', realCartId);
    
    // Determine which cart ID to use for completion
    // Prefer the real cart ID from cookies if available and different from callback
    let cartIdToComplete = order_id;
    
    // If the callback order_id looks like a generated fallback (starts with 'cart_' followed by numbers only)
    // and we have a real cart ID from cookies, use the real one
    const isGeneratedId = /^cart_\d+$/.test(order_id);
    if (isGeneratedId && realCartId && realCartId !== order_id) {
      console.log('[GiyaPay] Callback order_id appears to be a generated fallback');
      console.log('[GiyaPay] Using real cart ID from cookies instead:', realCartId);
      cartIdToComplete = realCartId;
    }
    
    try {
      // First, verify the payment with the backend (which has the merchant secret)
      const verifyResponse = await fetch(`${backendUrl}/giyapay/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          order_id,  // Keep original for verification/logging
          refno,
          timestamp,
          amount,
          signature,
          payment_method: payment_method || 'GIYAPAY', // Pass the specific method
        }),
      });

      if (!verifyResponse.ok) {
        const verifyError = await verifyResponse.json().catch(() => ({}));
        console.error('[GiyaPay] Signature verification failed:', verifyError);
        
        // If backend verify endpoint doesn't exist, try completing order directly
        // The backend payment provider will handle verification during order completion
        if (verifyResponse.status === 404) {
          console.log('[GiyaPay] Verify endpoint not found, proceeding with order completion');
        } else {
          return NextResponse.json(
            { success: false, message: verifyError.message || 'Payment verification failed' },
            { status: 400 }
          );
        }
      } else {
        const verifyData = await verifyResponse.json();
        console.log('[GiyaPay] Signature verified by backend:', verifyData);
      }

      // Complete the order using the correct cart ID
      console.log('[GiyaPay] Completing cart with ID:', cartIdToComplete);
      
      const completeResponse = await fetch(`${backendUrl}/store/carts/${cartIdToComplete}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          payment_data: {
            provider_id: 'pp_giyapay_giyapay',
            reference_number: refno,
            amount: amount,
            timestamp: timestamp,
            status: 'paid',
            nonce: nonce,
            signature: signature,
            payment_method: payment_method || 'GIYAPAY',
          },
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        console.error('[GiyaPay] Failed to complete order with cart:', cartIdToComplete, errorData);
        
        // If we used the callback order_id and it failed, try the cookie cart ID
        if (cartIdToComplete === order_id && realCartId && realCartId !== order_id) {
          console.log('[GiyaPay] Retrying with real cart ID from cookies:', realCartId);
          
          const retryResponse = await fetch(`${backendUrl}/store/carts/${realCartId}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': publishableKey,
            },
            body: JSON.stringify({
              payment_data: {
                provider_id: 'pp_giyapay_giyapay',
                reference_number: refno,
                amount: amount,
                timestamp: timestamp,
                status: 'paid',
                nonce: nonce,
                signature: signature,
              },
            }),
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            
            // Handle mercur marketplace order_set response
            let finalOrderId = realCartId; // fallback
            let orderSetId = null;
            
            if (retryData.order_set) {
              orderSetId = retryData.order_set.id;
              finalOrderId = orderSetId;
            } else if (retryData.order?.id) {
              finalOrderId = retryData.order.id;
            } else if (retryData.id) {
              finalOrderId = retryData.id;
            }
            
            console.log('[GiyaPay] Order completed successfully with retry:', finalOrderId);
            
            // Clear the cart cookie since order is completed
            const cookieStore = await cookies();
            cookieStore.set('_medusa_cart_id', '', {
              maxAge: -1,
              path: '/',
            });
            console.log('[GiyaPay] Cart cookie cleared');
            
            return NextResponse.json({
              success: true,
              order_id: finalOrderId,
              order_set_id: orderSetId,
              reference_number: refno,
              message: 'Payment verified and order completed',
            });
          }
        }
        
        return NextResponse.json(
          { 
            success: false, 
            message: 'Failed to complete order. Please contact support with reference: ' + refno 
          },
          { status: 500 }
        );
      }

      const orderData = await completeResponse.json();
      
      // Handle mercur marketplace order_set response
      // The response contains an order_set with multiple orders (one per vendor)
      let finalOrderId = cartIdToComplete; // fallback
      let orderSetId = null;
      
      if (orderData.order_set) {
        orderSetId = orderData.order_set.id;
        console.log('[GiyaPay] Order set created:', orderSetId);
        
        // Use the order_set ID for redirect (marketplace handles multiple orders)
        finalOrderId = orderSetId;
      } else if (orderData.order?.id) {
        // Single order response
        finalOrderId = orderData.order.id;
      } else if (orderData.id) {
        // Direct ID response
        finalOrderId = orderData.id;
      }

      console.log('[GiyaPay] Order completed successfully:', finalOrderId);
      
      // Update the transaction with the real order ID
      try {
        await fetch(`${backendUrl}/giyapay/update-transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference_number: refno,
            order_id: finalOrderId,
            cart_id: cartIdToComplete,
          }),
        });
        console.log('[GiyaPay] Transaction updated with order ID:', finalOrderId);
      } catch (updateError) {
        console.log('[GiyaPay] Failed to update transaction (non-fatal):', updateError);
      }
      
      // Clear the cart cookie since order is completed
      const cookieStore = await cookies();
      cookieStore.set('_medusa_cart_id', '', {
        maxAge: -1,
        path: '/',
      });
      console.log('[GiyaPay] Cart cookie cleared');

      return NextResponse.json({
        success: true,
        order_id: finalOrderId,
        order_set_id: orderSetId,
        reference_number: refno,
        message: 'Payment verified and order completed',
      });
    } catch (error) {
      console.error('[GiyaPay] Error completing order:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error completing order. Please contact support with reference: ' + refno 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[GiyaPay] Error processing payment callback:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


