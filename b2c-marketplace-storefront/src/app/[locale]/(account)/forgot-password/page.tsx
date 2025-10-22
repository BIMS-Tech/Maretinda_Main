import { Heading } from "@medusajs/ui"

import { ForgotPasswordForm } from "@/components/molecules/ForgotPasswordForm/ForgotPasswordForm"

export default async function ForgotPasswordPage() {
  return (
    <>
      <Heading
        className="mb-4 text-center text-5xl md:text-6xl text-black font-semibold mt-8"
        level="h1"
      >
        My Account
      </Heading>
      <ForgotPasswordForm />
    </>
  )
}
