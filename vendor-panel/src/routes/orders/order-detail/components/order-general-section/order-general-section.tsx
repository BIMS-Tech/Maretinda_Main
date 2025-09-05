import { CheckCircle, CreditCard, XCircle } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { fetchQuery } from "../../../../../lib/client"
import { useCancelOrder, useCompleteOrder } from "../../../../../hooks/api/orders"
import { useVendorCapturePayment } from "../../../../../hooks/api/payments"
import { useDate } from "../../../../../hooks/use-date"
import {
  getCanceledOrderStatus,
  getOrderFulfillmentStatus,
  getOrderPaymentStatus,
} from "../../../../../lib/order-helpers"

type OrderGeneralSectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderGeneralSection = ({ order }: OrderGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { getFullDate } = useDate()

  const { mutateAsync: cancelOrder } = useCancelOrder(order.id)
  const { mutateAsync: completeOrder } = useCompleteOrder(order.id)
  const payments = order?.payment_collections?.payments || []
  const codPayment = Array.isArray(payments)
    ? payments.find((p: any) => p?.provider_id === "pp_system_default")
    : undefined
  const codPaymentId = typeof codPayment?.id === "string" ? codPayment.id : ""
  const { mutateAsync: vendorCapture } = useVendorCapturePayment(order.id, codPaymentId)

  const handleComplete = async () => {
    await completeOrder(undefined, {
      onSuccess: () => {
        toast.success("Order completed")
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  const handleCancel = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("orders.cancelWarning", {
        id: `#${order.display_id}`,
      }),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await cancelOrder(undefined, {
      onSuccess: () => {
        toast.success(t("orders.orderCanceled"))
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return (
    <Container className="flex items-center justify-between px-6 py-4">
      <div>
        <div className="flex items-center gap-x-1">
          <Heading>#{order.display_id}</Heading>
          <Copy content={`#${order.display_id}`} className="text-ui-fg-muted" />
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.onDateFromSalesChannel", {
            date: getFullDate({ date: order.created_at, includeTime: true }),
            salesChannel: order.sales_channel?.name,
          })}
        </Text>
      </div>
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-1.5">
          <OrderBadge order={order} />
          <PaymentBadge order={order} />
          <FulfillmentBadge order={order} />
        </div>
        {(() => {
          const actionItems = [
            {
              label: t("actions.complete"),
              onClick: handleComplete,
              disabled: order.status !== "pending",
              icon: <CheckCircle />,
            },
            {
              label: t("orders.actions.capturePayment"),
              onClick: async () => {
                // If we have a specific COD payment id, use it; otherwise, call order-level capture endpoint
                if (codPaymentId) {
                  await vendorCapture(undefined, {
                    onSuccess: () => toast.success("Payment captured"),
                    onError: (e) => toast.error(e.message),
                  })
                } else {
                  await fetchQuery(`/vendor/orders/${order.id}/capture`, { method: 'POST' })
                  toast.success("Payment captured")
                }
              },
              // @ts-ignore
              disabled: order.payment_status === "captured",
              icon: <CreditCard />,
            },
            {
              label: t("actions.cancel"),
              onClick: handleCancel,
              //@ts-ignore
              disabled: !!order.canceled_at,
              icon: <XCircle />,
            },
          ].filter(Boolean) as any

          return <ActionMenu groups={[{ actions: actionItems }]} />
        })()}
      </div>
    </Container>
  )
}

const FulfillmentBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const { label, color } = getOrderFulfillmentStatus(
    t,
    order.fulfillment_status
  )

  return (
    <StatusBadge color={color} className="text-nowrap">
      {label}
    </StatusBadge>
  )
}

const PaymentBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const hasCOD = Array.isArray(order?.payment_collections?.payments)
    ? order.payment_collections.payments.some((p: any) => p?.provider_id === 'pp_system_default')
    : false
  const { label, color } = hasCOD ? { label: t('orders.payment.status.awaiting'), color: 'orange' } : getOrderPaymentStatus(t, order.payment_status)

  return (
    <StatusBadge color={color} className="text-nowrap">
      {label}
    </StatusBadge>
  )
}

const OrderBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()
  const orderStatus = getCanceledOrderStatus(t, order.status)

  if (!orderStatus) {
    return null
  }

  return (
    <StatusBadge color={orderStatus.color} className="text-nowrap">
      {orderStatus.label}
    </StatusBadge>
  )
}
