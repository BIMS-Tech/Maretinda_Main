import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

async function getToken() {
  const jar = await cookies()
  return jar.get('_medusa_jwt')?.value
}

// GET /api/chat/:id  → GET /store/chat/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken()
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${BACKEND}/store/chat/${params.id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
