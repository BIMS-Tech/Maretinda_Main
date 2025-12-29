import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"
import Image from "next/image"

// GiyaPay icon component with proper branding
const GiyaPayIcon = () => (
  <div className="flex items-center justify-center rounded-md overflow-hidden" style={{ width: '120px', height: '40px' }}>
    <div className="w-full h-full bg-gradient-to-r from-orange-400 via-pink-500 to-pink-600 flex items-center justify-center px-3 rounded-md">
      <span className="text-white font-bold text-sm tracking-wide">Pay with giyapay</span>
    </div>
  </div>
)

// Delivery truck icon for Cash on Delivery
const DeliveryTruckIcon = () => (
  <div className="flex items-center justify-center w-10 h-10">
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Truck body */}
      <rect x="6" y="18" width="20" height="10" fill="#FF6B35" rx="2"/>
      {/* Window */}
      <rect x="8" y="20" width="6" height="5" fill="#FFFFFF"/>
      {/* Cargo area */}
      <rect x="26" y="18" width="12" height="10" fill="#FFB84D" rx="2"/>
      {/* Wheels */}
      <circle cx="14" cy="30" r="3" fill="#4A5568"/>
      <circle cx="32" cy="30" r="3" fill="#4A5568"/>
      <circle cx="14" cy="30" r="1.5" fill="#CBD5E0"/>
      <circle cx="32" cy="30" r="1.5" fill="#CBD5E0"/>
    </svg>
  </div>
)

// Visa icon with blue logo
const VisaIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#1434CB"/>
      <text x="24" y="20" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold" fontFamily="Arial">VISA</text>
    </svg>
  </div>
)

// GCash icon with blue circle
const GCashIcon = () => (
  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold">G</text>
    </svg>
  </div>
)

// Union Pay icon
const UnionPayIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#E21836"/>
      <text x="24" y="20" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold" fontFamily="Arial">UnionPay</text>
    </svg>
  </div>
)

// Grab icon with green logo
const GrabIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#00B14F"/>
      <text x="24" y="20" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" fontFamily="Arial">Grab</text>
    </svg>
  </div>
)

// QR Ph icon
const QRPhIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
      <text x="12" y="20" textAnchor="middle" fontSize="8" fill="#EF4444" fontWeight="bold" fontFamily="Arial">QR</text>
      <text x="32" y="20" textAnchor="middle" fontSize="8" fill="#F59E0B" fontWeight="bold" fontFamily="Arial">Ph</text>
    </svg>
  </div>
)

// Mastercard icon
const MastercardIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#EB001B"/>
      <circle cx="18" cy="16" r="7" fill="#FF5F00"/>
      <circle cx="30" cy="16" r="7" fill="#F79E1B"/>
    </svg>
  </div>
)

// InstaPay icon
const InstaPayIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#10B981"/>
      <text x="24" y="14" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" fontFamily="Arial">Insta</text>
      <text x="24" y="22" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" fontFamily="Arial">Pay</text>
    </svg>
  </div>
)

// PayMaya icon
const PayMayaIcon = () => (
  <div className="flex items-center justify-center w-12 h-10">
    <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#8BC34A"/>
      <text x="24" y="20" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold" fontFamily="Arial">Maya</text>
    </svg>
  </div>
)

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  "pp_card_stripe-connect": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <CreditCard />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <CreditCard />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <CreditCard />,
  },
  pp_system_default: {
    title: "Cash on Delivery",
    icon: <DeliveryTruckIcon />,
  },
  giyapay: {
    title: "GiyaPay",
    icon: <GiyaPayIcon />,
  },
  pp_giyapay_giyapay: {
    title: "GiyaPay",
    icon: <GiyaPayIcon />,
  },
  "pp_giyapay_instapay": {
    title: "InstaPay",
    icon: <InstaPayIcon />,
  },
  "pp_giyapay_visa": {
    title: "Visa/Mastercard",
    icon: <VisaIcon />,
  },
  "pp_giyapay_mastercard": {
    title: "Visa/Mastercard", 
    icon: <MastercardIcon />,
  },
  "pp_giyapay_gcash": {
    title: "GCash",
    icon: <GCashIcon />,
  },
  "pp_giyapay_paymaya": {
    title: "PayMaya",
    icon: <PayMayaIcon />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  return providerId?.startsWith("pp_card_stripe-connect")
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}
export const isGiyaPay = (providerId?: string) => {
  return providerId === "giyapay" || providerId?.startsWith("pp_giyapay")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
