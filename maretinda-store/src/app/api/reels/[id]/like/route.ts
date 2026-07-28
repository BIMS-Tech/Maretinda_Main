import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

// POST /api/reels/:id/like → POST /store/reels/:id/like (toggle)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = (await cookies()).get('_medusa_jwt')?.value
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const res = await fetch(`${BACKEND}/store/reels/${id}/like`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-publishable-api-key': PUB_KEY,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({ message: 'Bad response from backend' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('[/api/reels/:id/like POST]', err?.message)
    return NextResponse.json({ message: 'Reels service unavailable' }, { status: 503 })
  }
}
