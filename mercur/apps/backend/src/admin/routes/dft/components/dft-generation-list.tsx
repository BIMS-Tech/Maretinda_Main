import { Button, Container, StatusBadge, Table, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { DftGenerateModal } from "./dft-generate-modal"

interface DftGeneration {
  id: string
  batch_id: string
  status: string
  generation_date: string
  total_amount: number
  transaction_count: number
  currency: string
  file_name?: string
  generated_by: string
}

export const DftGenerationList = () => {
  const [generations, setGenerations] = useState<DftGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  useEffect(() => {
    loadGenerations()
  }, [])

  const loadGenerations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/admin/dft')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch DFT generations: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Loaded DFT generations:', data)
      setGenerations(data.dft_generations || [])
    } catch (error) {
      console.error('Error loading DFT generations:', error)
      toast.error('Failed to load DFT generations. Please check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const response = await fetch(`/admin/dft/${id}/download`)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('DFT file downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download DFT file')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <StatusBadge color="orange">Pending</StatusBadge>
      case 'generated':
        return <StatusBadge color="green">Generated</StatusBadge>
      case 'downloaded':
        return <StatusBadge color="blue">Downloaded</StatusBadge>
      case 'processed':
        return <StatusBadge color="purple">Processed</StatusBadge>
      case 'failed':
        return <StatusBadge color="red">Failed</StatusBadge>
      default:
        return <StatusBadge color="grey">{status}</StatusBadge>
    }
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <div className="text-center">Loading DFT generations...</div>
      </Container>
    )
  }

  return (
    <>
      <Container className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Daily DFT Generation History</h2>
            <p className="text-ui-fg-subtle text-sm">
              Generate daily DFT files for vendor payouts and view processing history
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="primary" 
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2"
            >
              <span>📄</span>
              Generate Today's DFT
            </Button>
          </div>
        </div>

        {generations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-ui-fg-muted">
              <p className="text-lg font-medium mb-2">No DFT files generated yet</p>
              <p className="text-sm mb-4">
                Generate your first DFT file to get started with vendor payouts
              </p>
              <Button 
                variant="secondary" 
                onClick={() => setShowGenerateModal(true)}
              >
                Generate DFT File
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Batch ID</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Generation Date</Table.HeaderCell>
                <Table.HeaderCell>Transactions</Table.HeaderCell>
                <Table.HeaderCell>Total Amount</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {generations.map((generation) => (
                <Table.Row key={generation.id}>
                  <Table.Cell className="font-medium">
                    {generation.batch_id}
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(generation.status)}
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(generation.generation_date).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>{generation.transaction_count}</Table.Cell>
                  <Table.Cell>
                    {generation.currency} {Number(generation.total_amount || 0).toFixed(2)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      {generation.file_name && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleDownload(generation.id, generation.file_name!)}
                        >
                          Download
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      {showGenerateModal && (
        <DftGenerateModal 
          open={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            loadGenerations()
          }}
        />
      )}
    </>
  )
}
