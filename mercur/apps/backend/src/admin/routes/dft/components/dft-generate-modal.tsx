import { 
  Button, 
  Checkbox, 
  FocusModal, 
  Input, 
  Label, 
  Select, 
  StatusBadge, 
  Table, 
  Textarea, 
  toast 
} from "@medusajs/ui"
import { useEffect, useState } from "react"

interface Seller {
  id: string
  name: string
  dft_bank_name?: string
  dft_swift_code?: string
  dft_beneficiary_name?: string
  dft_account_number?: string
  has_complete_dft_info: boolean
}

interface DftGenerateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const DftGenerateModal = ({ open, onClose, onSuccess }: DftGenerateModalProps) => {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSellers, setSelectedSellers] = useState<string[]>([])
  const [sourceAccount, setSourceAccount] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (open) {
      loadSellers()
    }
  }, [open])

  const loadSellers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/admin/sellers?fields=id,name,handle,dft_bank_name,dft_swift_code,dft_beneficiary_name,dft_account_number,dft_bank_code,dft_beneficiary_code')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sellers: ${response.status}`)
      }
      
      const data = await response.json()
      
      const sellersWithDftInfo = (data.sellers || []).map((seller: any) => ({
        ...seller,
        has_complete_dft_info: !!(
          seller.dft_bank_name && 
          seller.dft_swift_code && 
          seller.dft_beneficiary_name && 
          seller.dft_account_number
        )
      }))
      
      console.log('Loaded sellers with DFT info:', sellersWithDftInfo)
      setSellers(sellersWithDftInfo)
    } catch (error) {
      console.error('Error loading sellers:', error)
      toast.error('Failed to load sellers. Please check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSellerToggle = (sellerId: string) => {
    setSelectedSellers(prev => 
      prev.includes(sellerId) 
        ? prev.filter(id => id !== sellerId)
        : [...prev, sellerId]
    )
  }

  const handleSelectAll = () => {
    const validSellerIds = sellers
      .filter(seller => seller.has_complete_dft_info)
      .map(seller => seller.id)
    
    setSelectedSellers(
      selectedSellers.length === validSellerIds.length ? [] : validSellerIds
    )
  }

  const handleGenerate = async () => {
    if (selectedSellers.length === 0) {
      toast.error('Please select at least one vendor')
      return
    }

    if (!sourceAccount.trim()) {
      toast.error('Please enter a source account')
      return
    }

    try {
      setIsGenerating(true)
      
      const response = await fetch('/admin/dft/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seller_ids: selectedSellers,
          source_account: sourceAccount,
          notes: notes
        })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()
      
      toast.success(
        `DFT file generated successfully! Included ${data.sellers_included} vendors.`
      )
      
      onSuccess()
    } catch (error) {
      console.error('Error generating DFT file:', error)
      toast.error('Failed to generate DFT file')
    } finally {
      setIsGenerating(false)
    }
  }

  const validSellers = sellers.filter(seller => seller.has_complete_dft_info)
  const invalidSellers = sellers.filter(seller => !seller.has_complete_dft_info)

  return (
    <FocusModal open={open} onOpenChange={onClose}>
      <FocusModal.Content>
        <FocusModal.Header>
          <h2 className="text-lg font-semibold">Generate Daily DFT File</h2>
          <p className="text-ui-fg-subtle text-sm">
            Generate today's DFT file for vendor payouts. Only vendors with available balances and complete bank information will be included.
          </p>
        </FocusModal.Header>

        <FocusModal.Body className="space-y-6">
          {/* Source Account */}
          <div>
            <Label htmlFor="sourceAccount" className="mb-2 block">
              Source Account Number *
            </Label>
            <Input
              id="sourceAccount"
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              placeholder="Enter source account number"
              required
            />
            <p className="text-xs text-ui-fg-subtle mt-1">
              The marketplace account from which transfers will be made
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="mb-2 block">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this DFT generation"
              rows={3}
            />
          </div>

          {/* Vendor Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Select Vendors</Label>
              {validSellers.length > 0 && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleSelectAll}
                >
                  {selectedSellers.length === validSellers.length ? 'Deselect All' : 'Select All Valid'}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-4">Loading vendors...</div>
            ) : (
              <>
                {/* Valid Vendors */}
                {validSellers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-green-700 mb-3">
                      Vendors with Complete DFT Information ({validSellers.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                      {validSellers.map((seller) => (
                        <div key={seller.id} className="flex items-center space-x-3 p-2 hover:bg-ui-bg-subtle rounded">
                          <Checkbox
                            checked={selectedSellers.includes(seller.id)}
                            onCheckedChange={() => handleSellerToggle(seller.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{seller.name}</p>
                            <p className="text-xs text-ui-fg-subtle">
                              {seller.dft_bank_name || 'No bank'} • {seller.dft_account_number || 'No account'}
                            </p>
                            <p className="text-xs text-ui-fg-subtle">
                              SWIFT: {seller.dft_swift_code || 'None'} • {seller.dft_beneficiary_name || 'No beneficiary'}
                            </p>
                          </div>
                          <StatusBadge color="green">Ready</StatusBadge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invalid Vendors */}
                {invalidSellers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-3">
                      Vendors Missing DFT Information ({invalidSellers.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-ui-bg-subtle">
                      {invalidSellers.map((seller) => {
                        const missingFields = []
                        if (!seller.dft_bank_name) missingFields.push('Bank Name')
                        if (!seller.dft_swift_code) missingFields.push('SWIFT Code')
                        if (!seller.dft_beneficiary_name) missingFields.push('Beneficiary Name')
                        if (!seller.dft_account_number) missingFields.push('Account Number')
                        
                        return (
                          <div key={seller.id} className="flex items-center justify-between p-2">
                            <div>
                              <p className="font-medium text-ui-fg-muted">{seller.name}</p>
                              <p className="text-xs text-ui-fg-subtle">
                                Missing: {missingFields.join(', ')}
                              </p>
                            </div>
                            <StatusBadge color="orange">Incomplete</StatusBadge>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-ui-fg-subtle mt-2">
                      These vendors need to complete their bank information in their store settings before they can be included in DFT files.
                    </p>
                  </div>
                )}

                {validSellers.length === 0 && (
                  <div className="text-center py-8 text-ui-fg-muted">
                    <p className="font-medium mb-2">No vendors available for DFT generation</p>
                    <p className="text-sm">
                      All vendors need to complete their bank information first.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </FocusModal.Body>

        <FocusModal.Footer>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={selectedSellers.length === 0 || !sourceAccount.trim()}
            >
              Generate DFT File
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
