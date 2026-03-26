import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"

// GiyaPay icon component with proper branding
const GiyaPayIcon = () => (
  <div
    className="flex items-center justify-center rounded-md px-4"
    style={{
      background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #db2777 100%)',
      minWidth: '160px',
      height: '40px',
    }}
  >
    <span className="text-white font-bold text-sm tracking-wide">Pay with </span>
    <span className="text-white font-extrabold text-sm italic ml-1" style={{ fontFamily: 'Georgia, serif' }}>giyapay</span>
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

const GiyaPayMethodIcon = ({ src, alt }: { src: string; alt: string }) => (
  <span style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}>
    <img src={src} alt={alt} style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
  </span>
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
  "pp_giyapay_mastercard_visa": {
    title: "Visa / Mastercard",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-mastercard-visa.png" alt="Visa/Mastercard" />,
  },
  "pp_giyapay_visa": {
    title: "VISA",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-mastercard-visa.png" alt="VISA" />,
  },
  "pp_giyapay_gcash": {
    title: "GCash",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-gcash.png" alt="GCash" />,
  },
  "pp_giyapay_instapay": {
    title: "InstaPay",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-instapay.png" alt="InstaPay" />,
  },
  "pp_giyapay_qrph": {
    title: "QR Ph",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-qrph.png" alt="QR Ph" />,
  },
  "pp_giyapay_unionpay": {
    title: "UnionPay",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-unionpay.png" alt="UnionPay" />,
  },
  "pp_giyapay_wechatpay": {
    title: "WeChat Pay",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-wechatpay.png" alt="WeChat Pay" />,
  },
  "pp_giyapay_grabpay": {
    title: "GrabPay",
    icon: <GiyaPayMethodIcon src="https://pay.giyapay.com/images/select-grabpay.png" alt="GrabPay" />,
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
