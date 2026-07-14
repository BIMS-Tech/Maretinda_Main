// Dedicated verification endpoint. Like bank-info, this bypasses the Mercur
// plugin's strict VendorUpdateSeller validator (registered on the exact
// /vendor/sellers/me matcher) so we can accept our custom verification fields.
export const AUTHENTICATE = true
