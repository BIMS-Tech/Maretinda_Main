import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { promises as fs } from 'fs'
import { join } from 'path'

/**
 * @oas [get] /admin/dft/{id}/download
 * operationId: "AdminDownloadDftFile"
 * summary: "Download DFT File"
 * description: "Downloads the generated DFT file."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the DFT generation.
 * responses:
 *   "200":
 *     description: File download
 *     content:
 *       text/plain:
 *         schema:
 *           type: string
 *   "404":
 *     description: File not found
 * tags:
 *   - Admin DFT
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  try {
    // For demo purposes, generate a sample DFT file content
    const sampleDftContent = generateSampleDftContent()
    const fileName = `DFT_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${id}.txt`
    
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    
    res.send(sampleDftContent)
  } catch (error) {
    res.status(404).json({ message: 'DFT file not found' })
  }
}

function generateSampleDftContent(): string {
  const lines: string[] = []
  
  // Sample DFT line according to MBOS format
  // D|Remittance Type|Currency|Amount|Source Account|Destination Account Number|1|Beneficiary Code|Beneficiary Name||||Beneficiary Address|SWIFT Code|Beneficiary Bank Address||Purpose|||0|||
  const lineData = [
    "D",           // Record type
    "TT",          // Remittance Type
    "PHP",         // Currency
    "50000.00",    // Amount
    "123456789",   // Source Account
    "987654321",   // Destination Account Number
    "1",           // Sequence
    "VENDOR001",   // Beneficiary Code
    "Sample Vendor", // Beneficiary Name
    "",            // Empty
    "",            // Empty
    "",            // Empty
    "",            // Empty
    "123 Main St, Manila, Philippines", // Beneficiary Address
    "BPIPHKHH",    // SWIFT Code
    "BPI Main Branch, Ayala Ave, Makati", // Beneficiary Bank Address
    "",            // Empty
    `DFT ${new Date().toISOString().slice(0, 10)}`, // Purpose
    "",            // Empty
    "",            // Empty
    "0",           // Charge Type
    "",            // Empty
    "",            // Empty
    ""             // Empty
  ]
  lines.push(lineData.join("|"))
  
  return lines.join('\n')
}
