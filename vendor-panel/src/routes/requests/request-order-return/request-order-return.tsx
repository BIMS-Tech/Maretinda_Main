import { useNavigate, useParams } from "react-router-dom"
import {
  useOrderReturnRequest,
  useUpdateOrderReturnRequest,
} from "../../../hooks/api/requests"
import { RouteDrawer } from "../../../components/modals"
import { Button, Select, Textarea } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Form } from "../../../components/common/form"

export function RequestOrderReturn() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { order_return_request, isLoading } = useOrderReturnRequest(id!)

  const form = useForm({
    defaultValues: {
      status: order_return_request?.status,
      vendor_reviewer_note: order_return_request?.vendor_reviewer_note || "",
    },
  })

  const { mutate: updateOrderReturnRequest } = useUpdateOrderReturnRequest(id!)

  const handleUpdateOrderReturnRequest = async (payload: any) => {
    console.log(payload)
    updateOrderReturnRequest(payload, {
      onSuccess: () => {
        navigate("/requests/orders", { replace: true })
      },
    })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  console.log(order_return_request)
  return (
    <RouteDrawer prev="/requests/orders">
      <RouteDrawer.Header>
        <RouteDrawer.Title>
          Request Return Order #{order_return_request.order.display_id}
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdateOrderReturnRequest)}>
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { onChange, value, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>Status</Form.Label>
                    <Form.Control>
                      <Select {...field} onValueChange={onChange}>
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {["refunded", "withdrawn", "escalated"].map(
                            (reason, index) => (
                              <Select.Item
                                key={`select-option-${index}`}
                                value={reason}
                              >
                                {reason}
                              </Select.Item>
                            )
                          )}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="vendor_reviewer_note"
              render={({ field }) => {
                return (
                  <Form.Item className="mt-4">
                    <Form.Label>Vendor Reviewer Note</Form.Label>
                    <Form.Control>
                      <Textarea {...field} rows={4} />
                    </Form.Control>
                  </Form.Item>
                )
              }}
            />
            <div className="flex justify-end mt-8">
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}
