import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

async function getToken() {
  const jar = await cookies()
  return jar.get('_medusa_jwt')?.value
}

// GET /api/chat  → GET /store/chat
export async function GET() {
  const token = await getToken()
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${BACKEND}/store/chat`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

// POST /api/chat  → POST /store/chat  (create conversation)
export async function POST(req: NextRequest) {
  const token = await getToken()
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const res = await fetch(`${BACKEND}/store/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
