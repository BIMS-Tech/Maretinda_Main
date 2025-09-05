"use client"

import { Button } from "@/components/atoms"
import { placeOrder } from "@/lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ErrorMessage } from "@/components/molecules"

type GiyaPayButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid"?: string
}

const GiyaPayButton = ({ cart, "data-testid": dataTestId }: GiyaPayButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()


  const onPaymentCompleted = () => {
    placeOrder()
      .then(() => {
        setSubmitting(false)
      })
      .catch((err) => {
        setErrorMessage(err.message)
        setSubmitting(false)
      })
  }

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (!cart) {
      setSubmitting(false)
      return
    }

    try {
      // Get the GiyaPay payment session data
      const activeSession = cart.payment_collection?.payment_sessions?.find(
        (session: any) => session.provider_id === "giyapay" || session.provider_id === "pp_giyapay_giyapay"
      )

      if (!activeSession) {
        throw new Error("GiyaPay payment session not found")
      }

      const paymentData = activeSession.data

      // Create the form for GiyaPay checkout
      const form = document.createElement('form')
      form.method = 'POST'
      // Use the API URL from backend configuration, but replace /api/payment with /checkout
      const backendApiUrl = paymentData.api_url || 'https://pay.giyapay.com/api/payment'
      form.action = backendApiUrl.replace('/api/payment', '/checkout')

      // Add all required fields as hidden inputs
      const fields = {
        success_callback: paymentData.success_callback,
        error_callback: paymentData.error_callback,
        cancel_callback: paymentData.cancel_callback,
        merchant_id: paymentData.merchant_id,
        amount: (paymentData.amount as number).toString(),
        currency: paymentData.currency,
        nonce: paymentData.nonce,
        timestamp: (paymentData.timestamp as number).toString(),
        description: paymentData.description,
        signature: paymentData.signature,
        // Do not force a method; let GiyaPay's checkout handle selection
        order_id: paymentData.order_id
      }

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = name
        input.value = value as string
        form.appendChild(input)
      })

      // Add form to page and submit
      document.body.appendChild(form)
      form.submit()

      // Clean up
      document.body.removeChild(form)

    } catch (error) {
      setErrorMessage((error as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={submitting}
        onClick={handlePayment}
        loading={submitting}
        className="w-full"
        data-testid={dataTestId}
      >
        Pay with GiyaPay
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="giyapay-payment-error-message"
      />
    </>
  )
}

export default GiyaPayButton 