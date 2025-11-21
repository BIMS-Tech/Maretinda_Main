import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"

// GiyaPay icon component
const GiyaPayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 4C2 2.89543 2.89543 2 4 2H20C21.1046 2 22 2.89543 22 4V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4Z"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M7 12L10 15L17 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// InstaPay icon
const InstaPayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 12h8M8 8h4M8 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Visa icon
const VisaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <text x="12" y="14" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">VISA</text>
  </svg>
)

// Mastercard icon
const MastercardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="9" cy="12" r="3" fill="currentColor" opacity="0.7"/>
    <circle cx="15" cy="12" r="3" fill="currentColor" opacity="0.7"/>
  </svg>
)

// GCash icon
const GCashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" fontWeight="bold">GCash</text>
  </svg>
)

// PayMaya icon
const PayMayaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" fontWeight="bold">PayMaya</text>
  </svg>
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
    icon: <Cash />,
  },
  giyapay: {
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
