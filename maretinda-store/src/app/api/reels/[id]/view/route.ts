import { NextResponse } from 'next/server'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

// POST /api/reels/:id/view — anonymous view counter, best effort
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await fetch(`${BACKEND}/store/reels/${id}/view`, {
      method: 'POST',
      headers: { 'x-publishable-api-key': PUB_KEY },
      cache: 'no-store',
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Analytics must never surface as an error to the player.
    return NextResponse.json({ ok: false })
  }
}
