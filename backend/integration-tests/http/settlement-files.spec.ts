import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import TamaFileGeneratorService from "../../src/services/tama-file-generator"
import { readSettlementFile, saveSettlementFile } from "../../src/lib/settlement-files"
import { applyCustomMigrations, bearer, createAdmin, createSeller, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * Settlement files list sellers' bank account numbers. They used to go to the
 * public media bucket; now they live in the database and only come out
 * through the admin download routes.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    async function tamaGeneration() {
      return new TamaFileGeneratorService(getContainer()).createTamaGeneration({
        batch_id: `B${Date.now()}`,
        generation_date: new Date(),
        file_name: `TAMA_${Date.now()}.txt`,
        total_amount: 1499,
        transaction_count: 1,
        funding_account: "2467246570570",
        generated_by: "test",
      } as any)
    }

    it("hands an admin the stored file", async () => {
      const id = await tamaGeneration()
      await saveSettlementFile(pgOf(getContainer()), {
        kind: "tama",
        generation_id: id,
        file_name: "batch.xls",
        content_type: "application/vnd.ms-excel",
        content: Buffer.from("account\t1234567890\n"),
      })
      const { token } = await createAdmin(getContainer())

      const res = await api.get(`/admin/tama/${id}/download`, { headers: bearer(token), responseType: "text" as any })

      expect(res.status).toBe(200)
      expect(res.data).toBe("account\t1234567890\n")
      expect(res.headers["content-disposition"]).toContain("batch.xls")
    })

    it("keeps the file from sellers", async () => {
      const id = await tamaGeneration()
      const { token } = await createSeller(getContainer())

      const res = await api.get(`/admin/tama/${id}/download`, { headers: bearer(token), ...noThrow })

      expect(res.status).toBe(401)
    })

    it("removes the file with its generation", async () => {
      const id = await tamaGeneration()
      const pg = pgOf(getContainer())
      await saveSettlementFile(pg, { kind: "tama", generation_id: id, file_name: "b.xls", content_type: "text/plain", content: Buffer.from("x") })
      const { token } = await createAdmin(getContainer())

      await api.delete(`/admin/tama/${id}`, { headers: bearer(token) })

      expect(await readSettlementFile(pg, "tama", id)).toBeNull()
    })
  },
})
