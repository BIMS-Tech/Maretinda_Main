import { Heading } from "@medusajs/ui"

import { ResetPasswordForm } from "@/components/molecules/ResetPasswordForm/ResetPasswordForm"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>
}) {
  const { token } = await searchParams
  return (
    <>
      <Heading
        className="mb-4 text-center text-5xl md:text-6xl text-black font-semibold mt-8"
        level="h1"
      >
        My Account
      </Heading>
      <ResetPasswordForm token={token} />
    </>
  )
}
