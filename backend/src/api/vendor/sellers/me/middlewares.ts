// import { authenticate } from "@medusajs/medusa/dist/utils"

export const AUTHENTICATE = true

// Disable automatic body validation - we handle it manually in the route
export const validateBody = false

// Validation is done directly in the POST handler 
// to avoid middleware conflicts with the plugin's default validator
