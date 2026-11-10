import crypto from "crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createSeller, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

const SANDBOX = { api_key: "fte_test_key", api_secret: "fte_test_secret_x" }
const WEBHOOK_URL = "https://api.example.test/webhooks/flyingtigers"

/**
 * The admin's Shipping Carriers page: everything a carrier needs is set up
 * there, including Flying Tigers' webhook, and the setup checklist reflects
 * the platform rather than fixed text.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })
    afterEach(() => jest.restoreAllMocks())

    const admin = async () => ({ headers: bearer((await createAdmin(getContainer())).token), ...noThrow })
    const saveFlyingTigers = async (creds: Record<string, unknown> = SANDBOX) =>
      pgOf(getContainer())("platform_shipping_provider").insert({
        id: `psp_${crypto.randomBytes(6).toString("hex")}`,
        provider_id: "flyingtigers",
        name: "Flying Tigers Express",
        is_active: true,
        credentials: JSON.stringify(creds),
        settings: JSON.stringify({}),
      })
    const flyingTigers = async () =>
      (await api.get("/admin/shipping-providers", await admin())).data.providers.find(
        (p: any) => p.provider_id === "flyingtigers"
      )

    it("says whether the saved Flying Tigers keys are sandbox or live", async () => {
      await saveFlyingTigers()
      expect(await flyingTigers()).toMatchObject({ mode: "sandbox", webhook_ready: false })
      await pgOf(getContainer())("platform_shipping_provider")
        .where({ provider_id: "flyingtigers" })
        .update({ credentials: JSON.stringify({ api_key: "fte_live_key", api_secret: "s" }) })
      expect((await flyingTigers()).mode).toBe("live")
    })

    it("never sends the saved secrets back", async () => {
      await saveFlyingTigers({ ...SANDBOX, webhook_secret: "whsec" })
      const body = JSON.stringify((await api.get("/admin/shipping-providers", await admin())).data)
      expect(body).not.toContain("fte_test_secret_x")
      expect(body).not.toContain("whsec")
    })

    describe("registering the webhook", () => {
      it("registers our URL with Flying Tigers and keeps the signing secret it returns", async () => {
        await saveFlyingTigers()
        const sent: any[] = []
        const realFetch = global.fetch
        jest.spyOn(global, "fetch").mockImplementation(async (url: any, init?: any) => {
          if (!String(url).includes("/api/webhooks/register")) return realFetch(url, init)
          sent.push({ url: String(url), headers: init?.headers, body: JSON.parse(init?.body ?? "{}") })
          return new Response(
            JSON.stringify({ id: 7, url: WEBHOOK_URL, isActive: true, mode: "sandbox", signingSecret: "whsec_from_ft" }),
            { status: 200 }
          )
        })

        const res = await api.post(
          "/admin/shipping-providers",
          { action: "register-webhook", provider_id: "flyingtigers", webhook_url: WEBHOOK_URL },
          await admin()
        )
        expect(res.status).toBe(200)
        expect(sent).toHaveLength(1)
        expect(sent[0].body).toMatchObject({ url: WEBHOOK_URL })
        expect(sent[0].headers).toMatchObject({ "x-api-key": "fte_test_key" })
        expect(await flyingTigers()).toMatchObject({
          webhook_ready: true,
          webhook: { id: 7, url: WEBHOOK_URL, mode: "sandbox" },
        })

        // Deliveries signed with that secret now update the shipment
        const pg = pgOf(getContainer())
        await pg("seller_shipping_order").insert({
          id: "vso_wh1",
          seller_id: "sel_x",
          provider: "flyingtigers",
          tracking_number: "FTWH1",
          status: "pending_pickup",
        })
        const body = JSON.stringify({ tracking_no: "FTWH1", event: "Delivered" })
        const ts = String(Date.now())
        const sig = crypto.createHmac("sha256", "whsec_from_ft").update(`${ts}.${body}`).digest("hex")
        const hook = await api.post("/webhooks/flyingtigers", body, {
          headers: { "content-type": "application/json", "x-fte-webhook-timestamp": ts, "x-fte-webhook-signature": `v1=${sig}` },
          ...noThrow,
        })
        expect(hook.status).toBe(200)
        expect((await pg("seller_shipping_order").where({ id: "vso_wh1" }).first()).status).toBe("delivered")
      })

      it.each([["http://api.example.test/webhooks/flyingtigers"], ["https://evil.example/hook"], [""]])(
        "refuses to register %j",
        async (webhook_url) => {
          await saveFlyingTigers()
          const spy = jest.spyOn(global, "fetch")
          const res = await api.post(
            "/admin/shipping-providers",
            { action: "register-webhook", provider_id: "flyingtigers", webhook_url },
            await admin()
          )
          expect(res.status).toBe(400)
          expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("/api/webhooks/register"), expect.anything())
        }
      )

      it("needs the API key saved first", async () => {
        const res = await api.post(
          "/admin/shipping-providers",
          { action: "register-webhook", provider_id: "flyingtigers", webhook_url: WEBHOOK_URL },
          await admin()
        )
        expect(res.status).toBe(400)
      })
    })

    describe("setup checklist", () => {
      it("checks for a Philippines region", async () => {
        const checklist = async () => (await api.get("/admin/shipping-providers", await admin())).data.checklist
        expect((await checklist()).ph_region).toBe(false)
        await getContainer().resolve(Modules.REGION).createRegions({ name: "PH", currency_code: "php", countries: ["ph"] })
        expect((await checklist()).ph_region).toBe(true)
      })

      it("counts the sellers who can ship", async () => {
        await createSeller(getContainer())
        const { checklist } = (await api.get("/admin/shipping-providers", await admin())).data
        expect(checklist).toMatchObject({ sellers_with_shipping: 0 })
        expect(checklist.sellers_total).toBeGreaterThanOrEqual(1)
      })
    })
  },
})
