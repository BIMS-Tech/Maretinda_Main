const { MetadataStorage } = require("@medusajs/framework/mikro-orm/core")

MetadataStorage.clear()
// The tests run with NODE_ENV=production, where every admin must use two-step
// sign-in. Test admins are minted tokens without it; admin-access.spec.ts
// switches it on where it is the subject.
if (process.env.ADMIN_MFA_REQUIRED === undefined) process.env.ADMIN_MFA_REQUIRED = "false"
