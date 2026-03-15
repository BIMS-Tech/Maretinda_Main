import { Footer } from "@/components/organisms"
import { NavbarLessHeader } from "@/components/organisms/Header/NavbarlessHeader"

export default async function NavbarLessLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <NavbarLessHeader />
      {children}
      <Footer />
    </>
  )
}
