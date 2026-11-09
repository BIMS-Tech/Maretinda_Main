import { describe, expect, test } from "vitest"

import { submitSellerApplication } from "../submit-application"

const response = (status: number) => ({ ok: status < 400, status, text: async () => "" })

describe("submitSellerApplication", () => {
  test("registers, then sends the application with the new token", async () => {
    const sent: string[] = []
    const result = await submitSellerApplication("a@example.test", "pw", {
      register: async () => "new-token",
      login: async () => "unused",
      postApplication: async (token) => (sent.push(token), response(200)),
    })
    expect(result).toEqual({ ok: true })
    expect(sent).toEqual(["new-token"])
  })

  // The account is created before the application is sent, so a failed send
  // used to leave the email "already registered" with no way to apply again
  test("signs in and retries when an earlier attempt already created the account", async () => {
    const sent: string[] = []
    const result = await submitSellerApplication("a@example.test", "pw", {
      register: async () => {
        throw new Error("Identity with email already exists")
      },
      login: async () => "existing-token",
      postApplication: async (token) => (sent.push(token), response(200)),
    })
    expect(result).toEqual({ ok: true })
    expect(sent).toEqual(["existing-token"])
  })

  test("asks to sign in when the email belongs to someone with another password", async () => {
    const result = await submitSellerApplication("a@example.test", "pw", {
      register: async () => {
        throw new Error("Identity with email already exists")
      },
      login: async () => {
        throw new Error("Invalid email or password")
      },
      postApplication: async () => response(200),
    })
    expect(result).toEqual({
      ok: false,
      message:
        "An account with this email already exists. Tap the pencil on the Email field above to use a different address, or sign in instead.",
    })
  })

  test("explains the hourly limit instead of a generic failure", async () => {
    const result = await submitSellerApplication("a@example.test", "pw", {
      register: async () => "t",
      login: async () => "t",
      postApplication: async () => response(429),
    })
    expect(result).toEqual({
      ok: false,
      message: "Too many applications from your network. Please try again in an hour.",
    })
  })

  test("keeps the generic message for other failures", async () => {
    const result = await submitSellerApplication("a@example.test", "pw", {
      register: async () => "t",
      login: async () => "t",
      postApplication: async () => response(500),
    })
    expect(result).toEqual({ ok: false, message: "Could not submit your application. Please try again." })
  })
})
