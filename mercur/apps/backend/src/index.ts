import { MedusaModule } from "@medusajs/framework/modules-sdk"

const startServer = async () => {
  try {
    console.log("Starting Medusa server...")
    const { medusaApp } = await MedusaModule.bootstrap({
      directory: process.cwd(),
    })
    
    const port = process.env.PORT || 8080
    const host = process.env.HOST || "0.0.0.0"
    
    console.log(`Server starting on ${host}:${port}`)
    await medusaApp.listen(port, host)
    console.log("Server started successfully!")
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()



