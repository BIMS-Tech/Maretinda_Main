import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

// Same pairing as the storefront: DM Serif Display for headlines, Inter for text.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sell on Maretinda — Open your online shop in the Philippines",
  description:
    "Open a shop on Maretinda, the Philippine marketplace for local sellers. List products, take GCash, InstaPay and card payments through GiyaPay, and ship nationwide — no commission on your sales.",
  keywords: ["maretinda", "sell online philippines", "online marketplace", "seller platform", "giyapay"],
  openGraph: {
    title: "Sell on Maretinda",
    description:
      "Open your shop on Maretinda and reach buyers across the Philippines. No commission on your sales.",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="font-sans text-ink bg-paper antialiased">
        {children}
      </body>
    </html>
  );
}
