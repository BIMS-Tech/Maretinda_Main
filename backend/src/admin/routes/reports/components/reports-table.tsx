import { useState, useEffect } from "react"
import { 
  Table, 
  Container, 
  Button, 
  Badge, 
  Heading,
  Text,
  DropdownMenu,
  IconButton,
  toast
} from "@medusajs/ui"
import { 
  EllipsisHorizontal, 
  ArrowDownTray, 
  Plus 
} from "@medusajs/icons"
import { GenerateReportModal } from "./generate-report-modal"

interface Report {
  id: string
  date: string
  file_name: string
  report_type: 'DFT' | 'TAMA'
  download_url: string
  status: string
  transaction_count: number
  total_amount: number
  currency: string
  generated_by: string
  created_at: string
}

export const ReportsTable = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/admin/reports')
      const data = await response.json()
      
      if (response.ok) {
        setReports(data.reports || [])
      } else {
        toast.error("Failed to fetch reports", {
          description: data.message || "Unable to load reports"
        })
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error("Failed to fetch reports", {
        description: "Unable to connect to server"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleDownload = async (report: Report) => {
    try {
      const response = await fetch(report.download_url)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = report.file_name + '.txt'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("File downloaded successfully")
    } catch (error) {
      console.error('Download error:', error)
      toast.error("Failed to download file", {
        description: "Please try again later"
      })
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency || 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'generated': { color: 'green' as const, label: 'Generated' },
      'pending': { color: 'orange' as const, label: 'Pending' },
      'failed': { color: 'red' as const, label: 'Failed' },
      'downloaded': { color: 'blue' as const, label: 'Downloaded' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge color={config.color} size="2xsmall">
        {config.label}
      </Badge>
    )
  }

  const getReportTypeBadge = (type: 'DFT' | 'TAMA') => {
    return (
      <Badge 
        color={type === 'DFT' ? 'blue' : 'purple'} 
        size="2xsmall"
      >
        {type}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="flex items-center justify-center h-32">
          <Text>Loading reports...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <Heading level="h2">All Reports</Heading>
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus />
          Generate Report
        </Button>
      </div>
      
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 px-6">
          <Text size="small" className="text-ui-fg-muted">
            No reports generated yet
          </Text>
          <Button 
            variant="secondary" 
            size="small"
            className="mt-2"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate your first report
          </Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>File Name</Table.HeaderCell>
              <Table.HeaderCell>Report Type</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Transactions</Table.HeaderCell>
              <Table.HeaderCell>Total Amount</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reports.map((report) => (
              <Table.Row key={report.id}>
                <Table.Cell>{formatDate(report.created_at)}</Table.Cell>
                <Table.Cell>
                  <Text weight="plus">{report.file_name}</Text>
                </Table.Cell>
                <Table.Cell>
                  {getReportTypeBadge(report.report_type)}
                </Table.Cell>
                <Table.Cell>
                  {getStatusBadge(report.status)}
                </Table.Cell>
                <Table.Cell>
                  <Text>{report.transaction_count}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{formatAmount(report.total_amount, report.currency)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleDownload(report)}
                      disabled={report.status !== 'generated'}
                    >
                      <ArrowDownTray />
                      Download
                    </Button>
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <IconButton size="small" variant="transparent">
                          <EllipsisHorizontal />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item 
                          onClick={() => handleDownload(report)}
                          disabled={report.status !== 'generated'}
                        >
                          <ArrowDownTray />
                          Download
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {showGenerateModal && (
        <GenerateReportModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            fetchReports()
          }}
        />
      )}
    </Container>
  )
}

