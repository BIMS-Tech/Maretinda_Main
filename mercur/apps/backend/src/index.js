const { MedusaModule } = require("@medusajs/framework/modules-sdk")

const startServer = async () => {
  const { medusaApp } = await MedusaModule.bootstrap({
    directory: process.cwd(),
  })
  
  await medusaApp.listen()
}

startServer().catch(console.error)
