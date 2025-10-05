import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

export default async function createAdminUser({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  try {
    const authService = container.resolve(Modules.AUTH)
    
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@maretinda.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    logger.info(`Creating admin user with email: ${adminEmail}`)
    
    // Check if admin user already exists
    try {
      const existingUser = await authService.authenticate('emailpass', {
        body: {
          email: adminEmail,
          password: adminPassword
        }
      })
      
      if (existingUser) {
        logger.info('Admin user already exists!')
        return
      }
    } catch (error) {
      // User doesn't exist, continue with creation
      logger.info('Admin user does not exist, creating new one...')
    }
    
    // Create admin user
    const { authIdentity } = await authService.register('emailpass', {
      body: {
        email: adminEmail,
        password: adminPassword
      }
    })
    
    if (authIdentity) {
      logger.info('✅ Admin user created successfully!')
      logger.info(`Email: ${adminEmail}`)
      logger.info(`Password: ${adminPassword}`)
      logger.info('You can now access the admin panel with these credentials.')
    } else {
      logger.error('❌ Failed to create admin user')
    }
    
  } catch (error) {
    logger.error('Error creating admin user:', error)
    throw error
  }
}
