import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('[GiyaPay] Cancelling order:', order_id);

    // Call Medusa backend to cancel the cart/order
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    
    try {
      // Delete the cart to cancel the order
      const cancelResponse = await fetch(`${backendUrl}/store/carts/${order_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (cancelResponse.ok) {
        console.log('[GiyaPay] Cart/Order cancelled successfully');
        
        return NextResponse.json({
          success: true,
          message: 'Order cancelled successfully',
        });
      } else {
        // Cart might already be deleted or doesn't exist
        console.log('[GiyaPay] Cart already deleted or does not exist');
        
        return NextResponse.json({
          success: true,
          message: 'Order cancellation processed',
        });
      }
    } catch (error) {
      console.error('[GiyaPay] Error cancelling order:', error);
      
      // Return success anyway as the payment was cancelled
      return NextResponse.json({
        success: true,
        message: 'Order cancellation processed',
      });
    }
  } catch (error) {
    console.error('[GiyaPay] Error processing cancellation:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


