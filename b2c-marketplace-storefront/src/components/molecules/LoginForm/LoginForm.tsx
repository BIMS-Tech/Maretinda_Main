"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Container, Divider } from "@medusajs/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  type FieldError,
  type FieldValues,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form"

import { Button, Checkbox } from "@/components/atoms"
import { LabeledInput } from "@/components/cells"
import { FacebookColorIcon, GoogleIcon } from "@/icons"
import { login } from "@/lib/data/customer"

import { type LoginFormData, loginFormSchema } from "./schema"

export const LoginForm = () => {
  const methods = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
    resolver: zodResolver(loginFormSchema),
  })

  return (
    <FormProvider {...methods}>
      <Form />
    </FormProvider>
  )
}

const Form = () => {
  const [error, setError] = useState("")
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext()
  const router = useRouter()
  const searchParams = useSearchParams()

  const submit = async (data: FieldValues) => {
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)

    const res = await login(formData)
    if (res) {
      setError(res)
      return
    }
    setError("")

    // Redirect to returnTo URL if provided, otherwise go to user page
    const returnTo = searchParams.get("returnTo")
    router.push(returnTo || "/user")
  }

  return (
    <main className="container">
      <Container className="border max-w-[793px] mx-auto mt-8 p-8">
        <div className="text-center mb-8">
          <h1 className="heading-xl text-4xl text-primary">Welcome Back!</h1>
          <p className="mt-5 text-base font-normal">Enter your details below</p>
        </div>
        <form onSubmit={handleSubmit(submit)}>
          <div className="flex flex-col w-full gap-4 max-w-full mx-auto px-2 space-y-4">
            <LabeledInput
              error={errors.email as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="E-mail"
              labelClassName="text-black/50 font-normal text-base"
              {...register("email")}
            />
            <LabeledInput
              error={errors.password as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="Password"
              labelClassName="text-black/50 font-normal text-base"
              type="password"
              {...register("password")}
            />
            <div className="flex flex-row justify-between">
              <Checkbox
                checked={watch("remember")}
                className="mb-4 rounded-none"
                label="Remember me"
                labelClassName="items-start text-base font-medium text-black/69"
                {...register("remember")}
              />

              <div>
                <Link
                  className="text-right text-base text-black/69 font-medium underline"
                  href="/user/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && <p className="label-md text-negative">{error}</p>}
            <Button
              className="w-full h-16 flex justify-center mt-8 mb-8 py-4 px-2 bg-black hover:bg-black text-xl text-white"
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="text"
            >
              Log In
            </Button>

            <div className="flex items-center mt-8">
              <div className="flex-grow">
                <Divider className="border-black/37 border-t-2" />
              </div>

              <span className="mx-8 text-base text-black font-medium">Or</span>

              <div className="flex-grow">
                <Divider className="border-black/37 border-t-2" />
              </div>
            </div>

            <div className="flex flex-row gap-9">
              <Button
                className="w-full flex justify-center mt-8 py-4 px-2 hover:bg-white/0 border-black border text-lg font-normal text-black"
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="text"
              >
                <span>
                  <GoogleIcon className="mr-2" />
                </span>
                Sign up with Google
              </Button>

              <Button
                className="w-full flex justify-center mt-8 py-4 px-2 hover:bg-white/0 border-black border text-lg font-normal text-black"
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="text"
              >
                <span>
                  <FacebookColorIcon className="mr-2" />
                </span>
                Sign up with Facebook
              </Button>
            </div>

            <div className="mt-8 text-center">
              Don&apos;t have an account yet?{" "}
              <Link className="underline" href="/user/register">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </Container>
    </main>
  )
}
