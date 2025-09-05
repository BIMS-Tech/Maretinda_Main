import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PHILIPPINE_BANKS, getBankByName, getBankBySwiftCode } from "../../../data/philippine-banks"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { search, category } = req.query

    let banks = PHILIPPINE_BANKS

    // Filter by category if provided
    if (category && typeof category === 'string') {
      banks = banks.filter(bank => bank.category === category)
    }

    // Filter by search term if provided
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase()
      banks = banks.filter(bank => 
        bank.name.toLowerCase().includes(searchTerm) ||
        bank.swift_code.toLowerCase().includes(searchTerm) ||
        bank.code.includes(searchTerm)
      )
    }

    // Sort alphabetically by name
    banks.sort((a, b) => a.name.localeCompare(b.name))

    res.json({
      banks: banks,
      count: banks.length,
      categories: ['universal', 'commercial', 'thrift', 'rural', 'cooperative']
    })

  } catch (error) {
    console.error('[Banks API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch banks',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}





