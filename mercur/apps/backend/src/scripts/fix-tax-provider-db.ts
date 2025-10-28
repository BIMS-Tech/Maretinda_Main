import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function fixTaxProviderInDatabase({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  try {
    logger.info("Starting tax provider database fix...")
    
    // Get the database manager from the container
    const manager = container.resolve(ContainerRegistrationKeys.MANAGER)
    
    // Execute raw SQL to update the tax_region table
    const result = await manager.query(`
      UPDATE tax_region 
      SET provider_id = 'simple-tax' 
      WHERE provider_id IS NULL OR provider_id = ''
      RETURNING id, country_code, provider_id
    `)
    
    logger.info(`✅ Updated ${result.length} tax region(s) in database`)
    
    if (result.length > 0) {
      logger.info("\n📋 Updated Tax Regions:")
      result.forEach((region: any) => {
        logger.info(`   ✓ ${region.country_code} (${region.id}): provider_id = ${region.provider_id}`)
      })
    }
    
    logger.info("\n✅ Database update complete!")
    logger.info("\n⚠️  IMPORTANT: Restart your backend server now:")
    logger.info("   1. Stop the server (Ctrl+C)")
    logger.info("   2. Start it again: npm run dev")
    logger.info("   3. The 'simple-tax' provider will now be active!")
    
  } catch (error) {
    logger.error("❌ Error updating tax provider:", error)
    logger.info("\n💡 Alternative: You can manually run this SQL in your database:")
    logger.info("   UPDATE tax_region SET provider_id = 'simple-tax' WHERE provider_id IS NULL;")
    throw error
  }
}

