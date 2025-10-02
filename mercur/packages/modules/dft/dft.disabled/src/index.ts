import { Module } from "@medusajs/framework/utils"
import DftModuleService from "./service"

export const DFT_MODULE = "dft"

export const dftModuleDefinition = Module(DFT_MODULE, {
  service: DftModuleService,
})

export default dftModuleDefinition

export * from "./models"
export * from "./types"
export { DftModuleService }
