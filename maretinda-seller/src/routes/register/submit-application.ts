type ApplicationResponse = { ok: boolean; status: number; text: () => Promise<string> }

export type SubmitApplicationDeps = {
  register: (email: string, password: string) => Promise<string>
  login: (email: string, password: string) => Promise<string>
  postApplication: (token: string) => Promise<ApplicationResponse>
}

const ACCOUNT_EXISTS =
  "An account with this email already exists. Tap the pencil on the Email field above to use a different address, or sign in instead."

/**
 * Creates the seller's login, then sends the application under it. The login
 * exists before the application does, so when a previous attempt got that far
 * and the send failed, signing in with the same password picks it back up.
 */
export async function submitSellerApplication(
  email: string,
  password: string,
  deps: SubmitApplicationDeps
): Promise<{ ok: true } | { ok: false; message: string }> {
  let token: string
  try {
    token = await deps.register(email, password)
  } catch (err) {
    if (!/already exists/i.test(err instanceof Error ? err.message : "")) throw err
    try {
      token = await deps.login(email, password)
    } catch {
      return { ok: false, message: ACCOUNT_EXISTS }
    }
  }

  const res = await deps.postApplication(token)
  if (res.ok) return { ok: true }

  console.error("[register-chat] seller-application failed", res.status, await res.text())
  if (res.status === 429) {
    return { ok: false, message: "Too many applications from your network. Please try again in an hour." }
  }
  return { ok: false, message: "Could not submit your application. Please try again." }
}
