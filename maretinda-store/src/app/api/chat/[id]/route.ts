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

// GET /api/chat/:id  → GET /store/chat/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${BACKEND}/store/chat/${id}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
