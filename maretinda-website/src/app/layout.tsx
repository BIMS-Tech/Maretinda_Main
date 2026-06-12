import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maretinda — The Ultimate seller Platform for the Philippines",
  description:
    "Maretinda is the Philippines' most powerful e-commerce seller platform. Launch your online store, reach millions of customers, and grow your business faster.",
  keywords: ["maretinda", "seller platform", "ecommerce philippines", "online store", "sell online"],
  openGraph: {
    title: "Maretinda — The Ultimate seller Platform for the Philippines",
    description:
      "Launch your online store, reach millions of customers, and grow your business on Maretinda.",
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
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans text-[#1A1228] bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
