import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/subscription/verify
 *
 * Next.js API route — proxies to the Medusa backend's /giyapay/verify endpoint
 * specifically for vendor subscription payments (order_id starts with "vsub_").
 *
 * This keeps the merchant secret server-side (in Medusa backend) and out of the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, order_id, refno, timestamp, amount, signature } = body;

    if (!nonce || !order_id || !refno || !signature) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment parameters' },
        { status: 400 }
      );
    }

    // Safety guard — this route is ONLY for subscription payments
    if (!String(order_id).startsWith('vsub_')) {
      return NextResponse.json(
        { success: false, message: 'Not a subscription payment' },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.MEDUSA_BACKEND_URL ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      'http://localhost:9000';

    // Call Medusa backend to verify signature and record the transaction
    const verifyResponse = await fetch(`${backendUrl}/giyapay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, order_id, refno, timestamp, amount, signature }),
    });

    if (!verifyResponse.ok) {
      const errData = await verifyResponse.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: (errData as any).message || 'Payment verification failed' },
        { status: verifyResponse.status }
      );
    }

    const verifyData = await verifyResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Subscription payment verified',
      refno,
      order_id,
      ...verifyData,
    });
  } catch (error) {
    console.error('[API /subscription/verify] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during payment verification' },
      { status: 500 }
    );
  }
}
