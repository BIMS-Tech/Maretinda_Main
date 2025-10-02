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
import { TamaGenerateModal } from "./tama-generate-modal"

interface TamaGeneration {
  id: string
  batch_id: string
  generation_date: string
  file_name: string
  status: string
  transaction_count: number
  total_amount: number
  currency: string
  generated_by: string
  funding_account: string
  notes?: string
  created_at: string
  updated_at: string
}

export const TamaGenerationList = () => {
  const [generations, setGenerations] = useState<TamaGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const fetchGenerations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/admin/tama')
      const data = await response.json()
      
      if (response.ok) {
        setGenerations(data.tama_generations || [])
      } else {
        toast.error("Failed to fetch TAMA generations", {
          description: data.message || "Unable to load TAMA generations"
        })
      }
    } catch (error) {
      console.error('Error fetching TAMA generations:', error)
      toast.error("Failed to fetch TAMA generations", {
        description: "Unable to connect to server"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGenerations()
  }, [])

  const handleDownload = async (generation: TamaGeneration) => {
    try {
      const response = await fetch(`/admin/tama/${generation.id}/download`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = generation.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("TAMA file downloaded successfully")
    } catch (error) {
      console.error('Download error:', error)
      toast.error("Failed to download TAMA file", {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <Container className="p-6">
        <div className="flex items-center justify-center h-32">
          <Text>Loading TAMA generations...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <Heading level="h2">TAMA Generations</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Metrobank transfer files generated from successful transactions
          </Text>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <Plus />
          Generate TAMA
        </Button>
      </div>
      
      {generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 px-6">
          <Text size="small" className="text-ui-fg-muted">
            No TAMA files generated yet
          </Text>
          <Button 
            variant="secondary" 
            size="small"
            className="mt-2"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate your first TAMA file
          </Button>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Batch ID</Table.HeaderCell>
              <Table.HeaderCell>File Name</Table.HeaderCell>
              <Table.HeaderCell>Generated</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Transactions</Table.HeaderCell>
              <Table.HeaderCell>Total Amount</Table.HeaderCell>
              <Table.HeaderCell>Funding Account</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {generations.map((generation) => (
              <Table.Row key={generation.id}>
                <Table.Cell>
                  <Text weight="plus" className="font-mono text-xs">
                    {generation.batch_id}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text weight="plus">{generation.file_name}</Text>
                  {generation.notes && (
                    <Text size="small" className="text-ui-fg-muted block">
                      {generation.notes}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">
                    {formatDate(generation.created_at)}
                  </Text>
                  <Text size="small" className="text-ui-fg-muted block">
                    by {generation.generated_by}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  {getStatusBadge(generation.status)}
                </Table.Cell>
                <Table.Cell>
                  <Text>{generation.transaction_count}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text>{formatAmount(generation.total_amount, generation.currency)}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text className="font-mono text-xs">{generation.funding_account}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => handleDownload(generation)}
                      disabled={generation.status !== 'generated'}
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
                          onClick={() => handleDownload(generation)}
                          disabled={generation.status !== 'generated'}
                        >
                          <ArrowDownTray />
                          Download TAMA File
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
        <TamaGenerateModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            fetchGenerations()
          }}
        />
      )}
    </Container>
  )
}

