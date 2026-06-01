import { cookies } from 'next/headers'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

// GET /api/chat/stream  → proxy SSE from /store/chat/stream
export async function GET() {
  const jar = await cookies()
  const token = jar.get('_medusa_jwt')?.value

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const upstream = await fetch(`${BACKEND}/store/chat/stream`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to connect to chat stream', { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
