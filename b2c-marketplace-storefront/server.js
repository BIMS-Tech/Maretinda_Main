const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT, 10) || 3000

console.log(`Starting server with:`)
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`- Development mode: ${dev}`)
console.log(`- Hostname: ${hostname}`)
console.log(`- Port: ${port}`)

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

console.log('Preparing Next.js app...')

app.prepare().then(() => {
  console.log('Next.js app prepared, creating server...')
  
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`✅ Server ready on http://${hostname}:${port}`)
      console.log(`✅ Started at ${new Date().toISOString()}`)
    })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  process.exit(1)
})
