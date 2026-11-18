import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { sign } from "jsonwebtoken"
import { stepAt, totpAt } from "../../src/lib/totp"
import { applyCustomMigrations, bearer, createAdmin, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

/** A fresh sign-in for the same admin: a different token, as after signing in again. */
const signIn = (userId: string) =>
  sign({ actor_id: userId, actor_type: "user", auth_identity_id: `authid_${userId}`, app_metadata: {}, n: Math.random() }, process.env.JWT_SECRET || "supersecret", {
    expiresIn: "1h",
  })

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    const as = (token: string) => ({ headers: bearer(token), ...noThrow })

    async function admin(role?: string) {
      const a = await createAdmin(getContainer())
      if (role) await pgOf(getContainer())("admin_role").insert({ email: a.user.email.toLowerCase(), role }).onConflict("email").merge()
      return a
    }

    describe("roles", () => {
      it("with no owner on record everyone is an owner, so nobody is locked out", async () => {
        await pgOf(getContainer())("admin_role").delete()
        const a = await admin()
        expect((await api.get("/admin/admin-roles/me", as(a.token))).data.role).toBe("owner")
      })

      it("lets each role change only its own area, and everyone read", async () => {
        const owner = await admin("owner")
        const viewer = await admin() // no role on record, and an owner exists
        const finance = await admin("finance")
        const support = await admin("support")
        const manager = await admin("manager")

        expect((await api.get("/admin/admin-roles/me", as(viewer.token))).data).toMatchObject({ role: "viewer", label: "Viewer" })

        // Reads are open, except the sensitive ones
        expect((await api.get("/admin/products", as(viewer.token))).status).toBe(200)
        expect((await api.get("/admin/users/me", as(viewer.token))).status).toBe(200)
        expect((await api.get("/admin/audit-log", as(viewer.token))).status).toBe(403)
        expect((await api.get("/admin/audit-log", as(owner.token))).status).toBe(200)

        const post = (token: string, path: string) => api.post(path, {}, as(token))
        const refused = async (token: string, path: string) => (await post(token, path)).data?.code === "role_not_allowed"

        expect(await refused(viewer.token, "/admin/products")).toBe(true)
        expect(await refused(support.token, "/admin/products")).toBe(true)
        expect(await refused(manager.token, "/admin/products")).toBe(false)
        expect(await refused(finance.token, "/admin/products")).toBe(true)

        expect(await refused(finance.token, "/admin/cod-remittances")).toBe(false)
        expect(await refused(manager.token, "/admin/cod-remittances")).toBe(true)

        expect(await refused(support.token, "/admin/listing-reports/1")).toBe(false)
        expect(await refused(manager.token, "/admin/listing-reports/1")).toBe(false)
        expect(await refused(finance.token, "/admin/listing-reports/1")).toBe(true)

        // Settings and anything unlisted: owners only
        expect(await refused(manager.token, "/admin/api-keys")).toBe(true)
        expect(await refused(manager.token, "/admin/stores/x")).toBe(true)
        expect(await refused(owner.token, "/admin/api-keys")).toBe(false)

        // Everyone keeps their own profile
        expect((await api.post(`/admin/users/${viewer.user.id}`, { first_name: "Vee" }, as(viewer.token))).status).toBe(200)
        expect(await refused(viewer.token, `/admin/users/${owner.user.id}`)).toBe(true)

        // The message says what happened
        expect((await post(viewer.token, "/admin/products")).data.message).toMatch(/Your admin role \(Viewer\)/)
      })

      it("only an owner sets roles, and the last owner can't be demoted", async () => {
        await pgOf(getContainer())("admin_role").delete()
        const owner = await admin("owner")
        const other = await admin("support")

        expect((await api.post("/admin/admin-roles", { email: owner.user.email, role: "viewer" }, as(other.token))).status).toBe(403)
        expect((await api.get("/admin/admin-roles", as(other.token))).status).toBe(403)

        const demoteLast = await api.post("/admin/admin-roles", { email: owner.user.email, role: "manager" }, as(owner.token))
        expect([demoteLast.status, demoteLast.data.message]).toEqual([400, expect.stringMatching(/only owner/)])

        expect((await api.post("/admin/admin-roles", { email: other.user.email, role: "manager" }, as(owner.token))).status).toBe(200)
        expect((await api.get("/admin/admin-roles/me", as(other.token))).data.role).toBe("manager")

        // A role can be set before the person accepts their invite
        expect((await api.post("/admin/admin-roles", { email: "New.Hire@Example.test", role: "finance" }, as(owner.token))).status).toBe(200)
        const list = await api.get("/admin/admin-roles", as(owner.token))
        expect(list.data.invited).toEqual(expect.arrayContaining([{ email: "new.hire@example.test", role: "finance" }]))
        expect(list.data.admins.find((a: any) => a.id === other.user.id)).toMatchObject({ role: "manager", mfa_enabled: false })
      })
    })

    describe("invites", () => {
      it("an invited admin can still accept, and gets the role chosen for them", async () => {
        await pgOf(getContainer())("admin_role").delete()
        const owner = await admin("owner")
        const email = `invited-${Date.now()}@example.test`
        await api.post("/admin/admin-roles", { email, role: "support" }, as(owner.token))
        const invite = await api.post("/admin/invites", { email }, as(owner.token))
        expect(invite.status).toBe(200)

        const reg = await api.post("/auth/user/emailpass/register", { email, password: "Invited-pass-1" }, noThrow)
        const accepted = await api.post(
          `/admin/invites/accept?token=${invite.data.invite.token}`,
          { first_name: "Ina", last_name: "Vited" },
          { headers: bearer(reg.data.token), ...noThrow }
        )
        expect(accepted.status).toBe(200)

        const login = await api.post("/auth/user/emailpass", { email, password: "Invited-pass-1" }, noThrow)
        expect((await api.get("/admin/admin-roles/me", as(login.data.token))).data.role).toBe("support")
      })
    })

    describe("two-step sign-in", () => {
      beforeAll(() => {
        process.env.ADMIN_MFA_REQUIRED = "true"
      })
      afterAll(() => {
        process.env.ADMIN_MFA_REQUIRED = "false"
      })

      it("is set up, then asked for at every new sign-in; recovery codes work once; an owner can reset it", async () => {
        await pgOf(getContainer())("admin_role").delete()
        const owner = await admin("owner")
        const a = await admin("manager")
        let token = a.token

        // Nothing else works until it's set up
        const blocked = await api.get("/admin/products", as(token))
        expect([blocked.status, blocked.data.code]).toEqual([403, "mfa_setup_required"])
        expect((await api.get("/admin/mfa", as(token))).data).toMatchObject({ enabled: false, required: true })

        const { secret, otpauth_url } = (await api.post("/admin/mfa/setup", {}, as(token))).data
        expect(otpauth_url).toContain(`secret=${secret}`)
        expect((await api.post("/admin/mfa/enable", { code: "000000" }, as(token))).status).toBe(400)

        const step = stepAt(Date.now())
        const enabled = await api.post("/admin/mfa/enable", { code: totpAt(secret, step) }, as(token))
        expect(enabled.status).toBe(200)
        const recovery: string[] = enabled.data.recovery_codes
        expect(recovery).toHaveLength(10)
        // The sign-in that set it up counts as verified
        expect((await api.get("/admin/products", as(token))).status).toBe(200)
        expect((await api.post("/admin/mfa/setup", {}, as(token))).status).toBe(409)

        // A new sign-in has to pass the second step
        token = signIn(a.user.id)
        const asked = await api.get("/admin/products", as(token))
        expect([asked.status, asked.data.code]).toEqual([403, "mfa_required"])
        // The code just used can't be replayed
        expect((await api.post("/admin/mfa/verify", { code: totpAt(secret, step) }, as(token))).status).toBe(400)
        expect((await api.post("/admin/mfa/verify", { code: totpAt(secret, step + 1) }, as(token))).status).toBe(200)
        expect((await api.get("/admin/products", as(token))).status).toBe(200)

        // A recovery code works once
        token = signIn(a.user.id)
        const viaRecovery = await api.post("/admin/mfa/verify", { code: recovery[0].toUpperCase() }, as(token))
        expect(viaRecovery.data).toMatchObject({ verified: true, method: "recovery", recovery_codes_left: 9 })
        token = signIn(a.user.id)
        expect((await api.post("/admin/mfa/verify", { code: recovery[0] }, as(token))).status).toBe(400)

        // Lost phone: an owner resets it, and it has to be set up again
        const ownerToken = await (async () => {
          const s = (await api.post("/admin/mfa/setup", {}, as(owner.token))).data.secret
          await api.post("/admin/mfa/enable", { code: totpAt(s, stepAt(Date.now())) }, as(owner.token))
          return owner.token
        })()
        expect((await api.post("/admin/mfa/reset", { user_id: a.user.id }, as(token))).status).toBe(403)
        expect((await api.post("/admin/mfa/reset", { user_id: a.user.id }, as(ownerToken))).data).toEqual({ reset: true })
        expect((await api.get("/admin/products", as(signIn(a.user.id)))).data.code).toBe("mfa_setup_required")
      })

      it("stores the secret encrypted, not as plain text", async () => {
        const a = await admin()
        const { secret } = (await api.post("/admin/mfa/setup", {}, as(a.token))).data
        const row = await pgOf(getContainer())("admin_mfa").where("user_id", a.user.id).first()
        expect(row.secret_enc).not.toContain(secret)
      })
    })
  },
})
