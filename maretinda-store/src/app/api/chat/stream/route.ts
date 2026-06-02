// Edge runtime required for SSE streaming — serverless functions time out on long-lived connections
export const runtime = 'edge'

const BACKEND = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ''

// GET /api/chat/stream  → proxy SSE from /store/chat/stream
export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const token = cookieHeader.match(/_medusa_jwt=([^;]+)/)?.[1]

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${BACKEND}/store/chat/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-publishable-api-key': PUB_KEY,
        Accept: 'text/event-stream',
      },
    })
  } catch {
    return new Response('Chat service unavailable', { status: 503 })
  }

  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to connect to chat stream', { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
