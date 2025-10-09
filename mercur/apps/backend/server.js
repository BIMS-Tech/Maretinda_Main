#!/usr/bin/env node

// Simple production server for Medusa
const { MedusaModule } = require("@medusajs/framework/modules-sdk")

async function startServer() {
  try {
    console.log("🚀 Starting Medusa server...")
    console.log("Environment:", process.env.NODE_ENV)
    console.log("Port:", process.env.PORT || 8080)
    console.log("Host:", process.env.HOST || "0.0.0.0")
    
    const { medusaApp } = await MedusaModule.bootstrap({
      directory: process.cwd(),
    })
    
    const port = parseInt(process.env.PORT) || 8080
    const host = process.env.HOST || "0.0.0.0"
    
    console.log(`🌐 Server starting on ${host}:${port}`)
    
    await medusaApp.listen(port, host)
    
    console.log("✅ Medusa server started successfully!")
    console.log(`📡 Listening on http://${host}:${port}`)
    
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  process.exit(0)
})

startServer()
