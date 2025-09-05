import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, StatusBadge, toast } from "@medusajs/ui"
import { CurrencyDollar, Plus } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

interface PayoutRequest {
  id: string
  seller_id: string
  seller_name: string
  amount: number
  currency: string
  status: string
  created_at: string
  updated_at: string
  dft_included: boolean
}

const PayoutsPage = () => {
  const navigate = useNavigate()
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPayouts()
  }, [])

  const loadPayouts = async () => {
    try {
      setIsLoading(true)
      // This would be replaced with actual API call
      // const response = await fetch('/admin/payouts')
      // const data = await response.json()
      // setPayouts(data.payouts || [])
      
      // Mock data for now
      setPayouts([
        {
          id: "payout_1",
          seller_id: "seller_1",
          seller_name: "Sample Vendor Store",
          amount: 150000,
          currency: "PHP",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          dft_included: false
        }
      ])
    } catch (error) {
      console.error('Error loading payouts:', error)
      toast.error('Failed to load payout requests')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string, dftIncluded: boolean) => {
    if (dftIncluded) {
      return <StatusBadge color="blue">DFT Ready</StatusBadge>
    }
    
    switch (status) {
      case 'pending':
        return <StatusBadge color="orange">Pending</StatusBadge>
      case 'approved':
        return <StatusBadge color="green">Approved</StatusBadge>
      case 'processing':
        return <StatusBadge color="blue">Processing</StatusBadge>
      case 'completed':
        return <StatusBadge color="green">Completed</StatusBadge>
      case 'rejected':
        return <StatusBadge color="red">Rejected</StatusBadge>
      default:
        return <StatusBadge color="grey">{status}</StatusBadge>
    }
  }

  const handleGenerateDFT = () => {
    navigate('/dft')
  }

  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'approved')
  const readyForDFT = payouts.filter(p => p.status === 'approved' && !p.dft_included)

  if (isLoading) {
    return (
      <Container className="p-6">
        <div className="text-center">Loading payout requests...</div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-1">
          <Heading level="h1">Payout Requests</Heading>
          <p className="text-ui-fg-subtle text-small">
            Manage vendor payout requests and generate DFT files for bank transfers
          </p>
        </div>
        <div className="flex gap-2">
          {readyForDFT.length > 0 && (
            <Button 
              variant="primary" 
              onClick={handleGenerateDFT}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate DFT ({readyForDFT.length} ready)
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CurrencyDollar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingPayouts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Ready for DFT</p>
              <p className="text-2xl font-bold">{readyForDFT.length}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Total Amount</p>
              <p className="text-2xl font-bold">
                ₱{payouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-PH')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="px-6 py-4">
        {payouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-ui-fg-muted">
              <p className="text-lg font-medium mb-2">No payout requests yet</p>
              <p className="text-sm">
                Vendors will see their payout requests here once they submit them
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Vendor</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Request Date</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payouts.map((payout) => (
                <Table.Row key={payout.id}>
                  <Table.Cell className="font-medium">
                    {payout.seller_name}
                  </Table.Cell>
                  <Table.Cell>
                    {payout.currency} {(payout.amount / 100).toLocaleString('en-PH', { 
                      minimumFractionDigits: 2 
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(payout.status, payout.dft_included)}
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(payout.created_at).toLocaleDateString('en-PH')}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => {
                          // Handle approve/reject actions
                          toast.info('Payout action functionality to be implemented')
                        }}
                      >
                        Review
                      </Button>
                      {payout.status === 'approved' && !payout.dft_included && (
                        <Button
                          variant="primary"
                          size="small"
                          onClick={handleGenerateDFT}
                        >
                          Add to DFT
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Payouts",
  icon: CurrencyDollar,
})

export default PayoutsPage
