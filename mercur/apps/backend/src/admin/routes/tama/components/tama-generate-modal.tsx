import { useState } from "react"
import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Textarea,
  toast,
  Text
} from "@medusajs/ui"

interface TamaGenerateModalProps {
  onClose: () => void
  onSuccess: () => void
}

export const TamaGenerateModal = ({ onClose, onSuccess }: TamaGenerateModalProps) => {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fundingAccount, setFundingAccount] = useState('2467246570570') // Default BIMS account
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fundingAccount.trim()) {
      toast.error("Funding account is required")
      return
    }
    
    setLoading(true)
    
    try {
      const body: any = {
        funding_account: fundingAccount.trim(),
        notes: notes.trim()
      }
      
      if (dateFrom || dateTo) {
        body.date_range = {}
        if (dateFrom) body.date_range.from = new Date(dateFrom).toISOString()
        if (dateTo) body.date_range.to = new Date(dateTo).toISOString()
      }
      
      const response = await fetch('/admin/tama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("TAMA file generated successfully", {
          description: `Generated file with ${data.tama_generation.transaction_count} Metrobank transactions`
        })
        onSuccess()
      } else {
        throw new Error(data.message || 'Failed to generate TAMA file')
      }
    } catch (error) {
      console.error('Error generating TAMA file:', error)
      toast.error("Failed to generate TAMA file", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setLoading(false)
    }
  }

  // Set default date range to today if not set
  const today = new Date().toISOString().split('T')[0]
  
  return (
    <FocusModal open onOpenChange={onClose}>
      <FocusModal.Content>
        <FocusModal.Header>
          <Heading>Generate TAMA File</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Generate "To Another Metrobank" file for Metrobank merchant settlements
          </Text>
        </FocusModal.Header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Funding Account */}
            <div>
              <Label htmlFor="fundingAccount">
                Funding Account <span className="text-red-500">*</span>
              </Label>
              <Input
                value={fundingAccount}
                onChange={(e) => setFundingAccount(e.target.value)}
                placeholder="BIMS Bank Account Number"
                required
                className="font-mono"
              />
              <Text size="small" className="text-ui-fg-muted mt-1">
                BIMS Bank Account Number that will fund the transfers (appears in header record)
              </Text>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  type="date"
                  value={dateFrom || today}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Text size="small" className="text-ui-fg-muted mt-1">
                  Start date for transaction filter
                </Text>
              </div>
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  type="date"
                  value={dateTo || today}
                  onChange={(e) => setDateTo(e.target.value)}
                />
                <Text size="small" className="text-ui-fg-muted mt-1">
                  End date for transaction filter
                </Text>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for this TAMA generation..."
                rows={3}
              />
              <Text size="small" className="text-ui-fg-muted mt-1">
                Internal notes for tracking this TAMA file generation
              </Text>
            </div>

            {/* Info Box */}
            <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
              <Heading level="h3" className="text-sm mb-2">
                TAMA File Details
              </Heading>
              <ul className="text-sm text-ui-fg-muted space-y-1">
                <li>• Only includes transactions for Metrobank merchants</li>
                <li>• File format: Header (H) + Detail records (D)</li>
                <li>• Transaction date will be T+1 (day after generation)</li>
                <li>• Transaction time will be set to 11:00 AM</li>
                <li>• File naming: TAMA - YYMMDD.txt</li>
              </ul>
            </div>
          </div>

          <FocusModal.Footer>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Generate TAMA File
              </Button>
            </div>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  )
}

