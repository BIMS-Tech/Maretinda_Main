import { useState } from "react"
import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Textarea,
  toast,
  Text
} from "@medusajs/ui"

interface GenerateReportModalProps {
  onClose: () => void
  onSuccess: () => void
}

export const GenerateReportModal = ({ onClose, onSuccess }: GenerateReportModalProps) => {
  const [reportType, setReportType] = useState<'dft' | 'tama'>('tama')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [fundingAccount, setFundingAccount] = useState('2467246570570') // Default BIMS account
  const [sourceAccount, setSourceAccount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (reportType === 'tama' && !fundingAccount) {
      toast.error("Funding account is required for TAMA reports")
      return
    }
    
    if (reportType === 'dft' && !sourceAccount) {
      toast.error("Source account is required for DFT reports")
      return
    }
    
    setLoading(true)
    
    try {
      const body: any = {
        report_type: reportType,
        notes
      }
      
      if (dateFrom || dateTo) {
        body.date_range = {}
        if (dateFrom) body.date_range.from = new Date(dateFrom).toISOString()
        if (dateTo) body.date_range.to = new Date(dateTo).toISOString()
      }
      
      if (reportType === 'tama') {
        body.funding_account = fundingAccount
      } else {
        body.source_account = sourceAccount
      }
      
      const response = await fetch('/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Report generated successfully", {
          description: `${reportType.toUpperCase()} report with ${data.report.transaction_count} transactions`
        })
        onSuccess()
      } else {
        throw new Error(data.message || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error("Failed to generate report", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FocusModal open onOpenChange={onClose}>
      <FocusModal.Content>
        <FocusModal.Header>
          <Heading>Generate Report</Heading>
        </FocusModal.Header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Report Type */}
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as 'dft' | 'tama')}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="tama">
                    TAMA (To Another Metrobank)
                  </Select.Item>
                  <Select.Item value="dft">
                    DFT (Data File Transfer)
                  </Select.Item>
                </Select.Content>
              </Select>
              <Text size="small" className="text-ui-fg-muted mt-1">
                {reportType === 'tama' 
                  ? 'Generate transfers for Metrobank merchants only'
                  : 'Generate transfers for non-Metrobank merchants'
                }
              </Text>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {/* Conditional Fields */}
            {reportType === 'tama' ? (
              <div>
                <Label htmlFor="fundingAccount">
                  Funding Account <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={fundingAccount}
                  onChange={(e) => setFundingAccount(e.target.value)}
                  placeholder="BIMS Bank Account Number"
                  required
                />
                <Text size="small" className="text-ui-fg-muted mt-1">
                  BIMS Bank Account Number for funding TAMA transfers
                </Text>
              </div>
            ) : (
              <div>
                <Label htmlFor="sourceAccount">
                  Source Account <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  placeholder="Source account for transfers"
                  required
                />
                <Text size="small" className="text-ui-fg-muted mt-1">
                  Source account for DFT transfers
                </Text>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for this report generation..."
                rows={3}
              />
            </div>
          </div>

          <FocusModal.Footer>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Generate {reportType.toUpperCase()} Report
              </Button>
            </div>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  )
}

