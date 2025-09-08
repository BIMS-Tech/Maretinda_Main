import type { Metadata } from "next"
import { Funnel_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@medusajs/ui"

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: {
    template: `%s | ${
      process.env.NEXT_PUBLIC_SITE_NAME ||
      "Maretinda - Your Complete Marketplace"
    }`,
    default:
      process.env.NEXT_PUBLIC_SITE_NAME ||
      "Maretinda - Your Complete Marketplace",
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Maretinda - From fresh groceries to latest fashion, discover everything you need from trusted local vendors",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  return (
    <html lang={locale} className="">
      <body
        className={`${funnelDisplay.className} antialiased bg-primary text-secondary relative`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
