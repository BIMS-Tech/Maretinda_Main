"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Container } from "@medusajs/ui"
import Link from "next/link"
import { useState } from "react"
import {
  type FieldError,
  type FieldValues,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form"

import { Button, Checkbox, Divider } from "@/components/atoms"
import { LabeledInput } from "@/components/cells"
import { FacebookColorIcon, GoogleIcon } from "@/icons"
import { signup } from "@/lib/data/customer"

import { type RegisterFormData, registerFormSchema } from "./schema"

export const RegisterForm = () => {
  const methods = useForm<RegisterFormData>({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      phone: "",
      terms: false,
    },
    resolver: zodResolver(registerFormSchema),
  })

  return (
    <FormProvider {...methods}>
      <Form />
    </FormProvider>
  )
}

const Form = () => {
  const [passwordError, setPasswordError] = useState({
    "8chars": false,
    isValid: false,
    lower: false,
    symbolOrDigit: false,
    upper: false,
  })
  const [error, setError] = useState()
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext()

  const submit = async (data: FieldValues) => {
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("first_name", data.firstName)
    formData.append("last_name", data.lastName)
    formData.append("phone", data.phone)

    const res = passwordError.isValid && (await signup(formData))

    if (res && !res?.id) setError(res)
  }

  return (
    <main className="container">
      <Container className="border max-w-[793px] mx-auto mt-8 p-8">
        <div className="text-center mb-8">
          <h1 className="heading-xl text-4xl text-primary">
            Create an Account
          </h1>
          <p className="mt-5 text-base font-normal">Enter your details below</p>
        </div>
        <form onSubmit={handleSubmit(submit)}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <LabeledInput
              className="md:w-1/2"
              error={errors.firstName as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="First Name"
              labelClassName="text-black/50 font-normal text-base"
              {...register("firstName")}
            />
            <LabeledInput
              className="md:w-1/2"
              error={errors.lastName as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="Last Name"
              labelClassName="text-black/50 font-normal text-base"
              {...register("lastName")}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <LabeledInput
              className="md:w-1/2"
              error={errors.email as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="Ph Number"
              labelClassName="text-black/50 font-normal text-base"
              {...register("phone")}
            />
            <LabeledInput
              className="md:w-1/2"
              error={errors.phone as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="Email"
              labelClassName="text-black/50 font-normal text-base"
              {...register("email")}
            />
          </div>
          <div>
            <LabeledInput
              className="mb-4"
              error={errors.password as FieldError}
              important
              inputClassName="border border-black bg-white"
              label="Password"
              labelClassName="text-black/50 font-normal text-base"
              type="password"
              {...register("password")}
            />
            {/* <PasswordValidator
              password={watch("password")}
              setError={setPasswordError}
            /> */}
          </div>
          <div>
            <Checkbox
              checked={watch("terms")}
              className="mb-4 rounded-none"
              label="Agree to the Terms & Conditions and Privacy Policy"
              labelClassName="items-start text-base font-medium text-black/69"
              {...register("terms")}
            />
          </div>
          {error && <p className="label-md text-negative">{error}</p>}
          <Button
            className="w-full h-16 flex justify-center mt-8 py-4 px-2 bg-black hover:bg-black text-xl text-white"
            disabled={isSubmitting}
            loading={isSubmitting}
            variant="text"
          >
            Create an Account
          </Button>
          <div className="flex items-center mt-8 mb-4">
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
            Already have an account?{" "}
            <Link className="underline" href="/user">
              Log in
            </Link>
          </div>
        </form>
      </Container>
    </main>
  )
}
