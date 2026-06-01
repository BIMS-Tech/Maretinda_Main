import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

async function getToken() {
  const jar = await cookies()
  return jar.get('_medusa_jwt')?.value
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'x-publishable-api-key': PUB_KEY,
  }
}

// GET /api/chat  → GET /store/chat
export async function GET() {
  try {
    const token = await getToken()
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const res = await fetch(`${BACKEND}/store/chat`, {
      headers: authHeaders(token),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ message: 'Bad response from backend' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('[/api/chat GET]', err?.message)
    return NextResponse.json({ message: 'Chat service unavailable' }, { status: 503 })
  }
}

// POST /api/chat  → POST /store/chat  (create or get conversation)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken()
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const res = await fetch(`${BACKEND}/store/chat`, {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ message: 'Bad response from backend' }))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    console.error('[/api/chat POST]', err?.message)
    return NextResponse.json({ message: 'Chat service unavailable' }, { status: 503 })
  }
}
