"use client"

import { Button } from "@medusajs/ui"
import { Truck } from "@medusajs/icons"
import { useRouter } from "next/navigation"

export const ShippingNav = () => {
  const router = useRouter()

  return (
    <Button
      variant="secondary"
      size="small"
      onClick={() => router.push('/admin/shipping')}
      className="flex items-center gap-2"
    >
      <Truck className="w-4 h-4" />
      Shipping
    </Button>
  )
}













































