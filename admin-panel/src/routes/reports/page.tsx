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
  toast,
  Checkbox
} from "@medusajs/ui"
import { 
  EllipsisHorizontal, 
  ArrowDownTray, 
  Plus,
  Eye,
  Trash
} from "@medusajs/icons"

interface Report {
  id: string
  date: string
  file_name: string
  report_type: 'DFT' | 'TAMA' | 'SALES'
  download_url: string
  status: string
  transaction_count: number
  total_amount: number
  currency: string
  generated_by: string
  created_at: string
}

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [viewingReport, setViewingReport] = useState<{ report: Report; content: string } | null>(null)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/admin/reports`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Authentication required", {
            description: "Please log in to view reports"
          })
          return
        }
        const data = await response.json()
        toast.error("Failed to fetch reports", {
          description: data.message || "Unable to load reports"
        })
        return
      }
      
      const data = await response.json()
      setReports(data.reports || [])
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
      const response = await fetch(report.download_url, {
        credentials: 'include'
      })
      
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

  const handleView = async (report: Report) => {
    try {
      const endpoint = report.report_type === 'TAMA' 
        ? `/admin/tama/${report.id}` 
        : `/admin/dft/${report.id}`
      
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to load file preview')
      }
      
      const data = await response.json()
      const preview = data.tama_generation?.file_preview || data.dft_generation?.file_preview || 'No preview available'
      
      setViewingReport({ report, content: preview })
      
    } catch (error) {
      console.error('View error:', error)
      toast.error("Failed to view file", {
        description: "Please try again later"
      })
    }
  }

  const handleDelete = async (report: Report) => {
    try {
      const endpoint = report.report_type === 'TAMA' 
        ? `/admin/tama/${report.id}` 
        : `/admin/dft/${report.id}`
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Delete failed')
      }
      
      toast.success("Report deleted successfully", {
        description: `${report.file_name} has been removed`
      })
      fetchReports() // Refresh the list
      
    } catch (error) {
      console.error('Delete error:', error)
      toast.error("Failed to delete report", {
        description: "Please try again later"
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      toast.warning("No reports selected", {
        description: "Please select at least one report to delete"
      })
      return
    }

    try {
      const deletePromises = selectedReports.map(async (reportId) => {
        const report = reports.find(r => r.id === reportId)
        if (!report) return

        const endpoint = report.report_type === 'TAMA' 
          ? `/admin/tama/${report.id}` 
          : `/admin/dft/${report.id}`
        
        return fetch(endpoint, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      })

      await Promise.all(deletePromises)
      
      toast.success(`${selectedReports.length} reports deleted successfully`)
      setSelectedReports([])
      fetchReports()
      
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error("Failed to delete some reports", {
        description: "Please try again"
      })
    }
  }

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([])
    } else {
      setSelectedReports(reports.map(r => r.id))
    }
  }

  const toggleSelectReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
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

  const handleGenerateSettlement = async () => {
    try {
      setGenerating(true)
      const response = await fetch(`/admin/settlement/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success("Settlement reports generated successfully", {
          description: `TAMA: ${data.tama?.transaction_count || 0} txns, DFT: ${data.dft?.transaction_count || 0} txns`
        })
        fetchReports()
      } else {
        toast.error("Failed to generate settlement reports", {
          description: data.message || "Unable to generate reports"
        })
      }
    } catch (error) {
      console.error('Generate error:', error)
      toast.error("Failed to generate settlement reports", {
        description: "Unable to connect to server"
      })
    } finally {
      setGenerating(false)
    }
  }

  const getReportTypeBadge = (type: 'DFT' | 'TAMA' | 'SALES') => {
    const colorMap = {
      'DFT': 'blue' as const,
      'TAMA': 'purple' as const,
      'SALES': 'green' as const
    }
    
    return (
      <Badge 
        color={colorMap[type] || 'blue'} 
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
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Settlement Reports</Heading>
          <p className="text-ui-fg-subtle">
            View and download TAMA, DFT, and Sales reports for settlements
          </p>
          <p className="text-ui-fg-muted text-xs mt-1">
            Reports are automatically generated daily at 11:00 PM. You can also generate them manually.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedReports.length > 0 && (
            <Button
              size="small"
              variant="danger"
              onClick={handleBulkDelete}
            >
              <Trash />
              Delete Selected ({selectedReports.length})
            </Button>
          )}
          <Button
            size="small"
            variant="secondary"
            onClick={handleGenerateSettlement}
            disabled={generating}
            isLoading={generating}
          >
            <Plus />
            Generate Settlement Reports
          </Button>
        </div>
      </div>
      
      <Container className="p-0">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-6">
            <Text size="small" className="text-ui-fg-muted">
              No reports generated yet
            </Text>
            <Text size="small" className="text-ui-fg-muted mt-2">
              Click "Generate Settlement Reports" to create your first report
            </Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell className="w-12">
                  <Checkbox
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </Table.HeaderCell>
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
                  <Table.Cell>
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => toggleSelectReport(report.id)}
                    />
                  </Table.Cell>
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
                        onClick={() => handleView(report)}
                        disabled={report.status !== 'generated'}
                      >
                        <Eye />
                        View
                      </Button>
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
                            onClick={() => handleView(report)}
                            disabled={report.status !== 'generated'}
                          >
                            <Eye />
                            View Preview
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            onClick={() => handleDownload(report)}
                            disabled={report.status !== 'generated'}
                          >
                            <ArrowDownTray />
                            Download
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item 
                            onClick={() => handleDelete(report)}
                            className="text-ui-fg-error"
                          >
                            <Trash />
                            Delete
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
      </Container>

      {/* File Preview Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingReport(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-ui-border-base">
              <div className="flex items-start justify-between">
                <div>
                  <Heading level="h2">{viewingReport.report.file_name}</Heading>
                  <div className="flex gap-2 mt-2">
                    {getReportTypeBadge(viewingReport.report.report_type)}
                    {getStatusBadge(viewingReport.report.status)}
                    <Badge size="2xsmall">
                      {viewingReport.report.transaction_count} transactions
                    </Badge>
                    <Badge size="2xsmall">
                      {formatAmount(viewingReport.report.total_amount, viewingReport.report.currency)}
                    </Badge>
                  </div>
                </div>
                <Button size="small" variant="secondary" onClick={() => setViewingReport(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <div className="bg-ui-bg-subtle rounded-lg p-4 font-mono text-xs">
                <pre className="whitespace-pre-wrap">{viewingReport.content}</pre>
              </div>
              <Text size="small" className="text-ui-fg-muted mt-2">
                Showing first 10-20 lines. Download for full file.
              </Text>
            </div>
            <div className="p-6 border-t border-ui-border-base flex justify-end gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  handleDownload(viewingReport.report)
                  setViewingReport(null)
                }}
              >
                <ArrowDownTray />
                Download Full File
              </Button>
              <Button size="small" onClick={() => setViewingReport(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export default ReportsPage
