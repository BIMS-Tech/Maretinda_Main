import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/subscription/activate-renewal
 *
 * Next.js API route that proxies the renewal activation to Medusa backend.
 * Called by the store's GiyaPay success page after a seller renewal payment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference_number, order_id } = body

    if (!reference_number || !order_id) {
      return NextResponse.json(
        { success: false, message: 'reference_number and order_id are required' },
        { status: 400 }
      )
    }

    if (!String(order_id).startsWith('vrenew_')) {
      return NextResponse.json(
        { success: false, message: 'Not a seller renewal payment' },
        { status: 400 }
      )
    }

    const backendUrl =
      process.env.MEDUSA_BACKEND_URL ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      'http://localhost:9000'

    const publishableKey =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

    const response = await fetch(`${backendUrl}/store/subscription/activate-renewal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey,
      },
      body: JSON.stringify({ reference_number, order_id }),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.ok ? 200 : response.status })
  } catch (error) {
    console.error('[activate-renewal] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to activate subscription renewal' },
      { status: 500 }
    )
  }
}
