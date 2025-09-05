import { MedusaService } from "@medusajs/framework/utils"
import { Context, EntityManager, MedusaContext } from "@medusajs/framework/types"
import { InjectTransactionManager } from "@medusajs/framework/utils"

import { 
  DftConfiguration, 
  DftGeneration, 
  DftTransaction,
  DftStatus,
  DftTransactionStatus
} from "./models"

import {
  CreateDftConfigurationDTO,
  UpdateDftConfigurationDTO,
  CreateDftGenerationDTO,
  UpdateDftGenerationDTO,
  CreateDftTransactionDTO,
  DftGenerationRequest,
  DftLineData
} from "./types"

class DftModuleService extends MedusaService({
  DftConfiguration,
  DftGeneration,
  DftTransaction,
}) {
  
  // DFT Configuration methods
  @InjectTransactionManager()
  async createDftConfiguration(
    data: CreateDftConfigurationDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.createDftConfigurations(data, sharedContext)
  }

  @InjectTransactionManager()
  async updateDftConfiguration(
    id: string,
    data: UpdateDftConfigurationDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.updateDftConfigurations(id, data, sharedContext)
  }

  @InjectTransactionManager()
  async getDftConfigurationBySeller(
    seller_id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const configurations = await this.listDftConfigurations(
      { seller_id },
      {},
      sharedContext
    )
    return configurations[0] || null
  }

  @InjectTransactionManager()
  async verifyDftConfiguration(
    id: string,
    verified_by: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.updateDftConfigurations(
      id,
      {
        is_verified: true,
        verification_date: new Date(),
        created_by: verified_by
      },
      sharedContext
    )
  }

  // DFT Generation methods
  @InjectTransactionManager()
  async createDftGeneration(
    data: CreateDftGenerationDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const generationData = {
      ...data,
      generation_date: new Date(),
      status: DftStatus.PENDING
    }
    return await this.createDftGenerations(generationData, sharedContext)
  }

  @InjectTransactionManager()
  async updateDftGeneration(
    id: string,
    data: UpdateDftGenerationDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.updateDftGenerations(id, data, sharedContext)
  }

  @InjectTransactionManager()
  async markDftAsDownloaded(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.updateDftGenerations(
      id,
      {
        status: DftStatus.DOWNLOADED,
        downloaded_at: new Date()
      },
      sharedContext
    )
  }

  // DFT Transaction methods
  @InjectTransactionManager()
  async createDftTransaction(
    data: CreateDftTransactionDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const transactionData = {
      ...data,
      status: DftTransactionStatus.PENDING
    }
    return await this.createDftTransactions(transactionData, sharedContext)
  }

  @InjectTransactionManager()
  async getDftTransactionsByGeneration(
    dft_generation_id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.listDftTransactions(
      { dft_generation_id },
      { order: { line_number: "ASC" } },
      sharedContext
    )
  }

  @InjectTransactionManager()
  async updateDftTransactionStatus(
    id: string,
    status: DftTransactionStatus,
    error_message?: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return await this.updateDftTransactions(
      id,
      { status, error_message },
      sharedContext
    )
  }

  // File generation methods
  generateDftFileContent(transactions: any[]): string {
    const lines: string[] = []
    
    transactions.forEach((transaction, index) => {
      const line = this.generateDftLine(transaction, index + 1)
      lines.push(line)
    })
    
    return lines.join('\n')
  }

  private generateDftLine(transaction: any, sequenceNumber: number): string {
    // Format: D|Remittance Type|Currency|Amount|Source Account|Destination Account Number|1|Beneficiary Code|Beneficiary Name||||Beneficiary Address|SWIFT Code|Beneficiary Bank Address||Purpose|||0|||
    const lineData: DftLineData = {
      remittance_type: transaction.remittance_type || "TT",
      currency: transaction.currency || "PHP", 
      amount: transaction.amount.toString(),
      source_account: transaction.source_account,
      destination_account: transaction.beneficiary_account,
      sequence_number: "1",
      beneficiary_code: transaction.beneficiary_code,
      beneficiary_name: transaction.beneficiary_name,
      beneficiary_address: transaction.beneficiary_address,
      swift_code: transaction.swift_code,
      beneficiary_bank_address: transaction.bank_address,
      purpose: transaction.purpose,
      charge_type: transaction.charge_type || "0"
    }

    // Build DFT line according to MBOS format
    return [
      "D",
      lineData.remittance_type,
      lineData.currency,
      lineData.amount,
      lineData.source_account,
      lineData.destination_account,
      lineData.sequence_number,
      lineData.beneficiary_code,
      lineData.beneficiary_name,
      "", // Empty field
      "", // Empty field  
      "", // Empty field
      "", // Empty field
      lineData.beneficiary_address,
      lineData.swift_code,
      lineData.beneficiary_bank_address,
      "", // Empty field
      lineData.purpose,
      "", // Empty field
      "", // Empty field
      lineData.charge_type,
      "", // Empty field
      "", // Empty field
      ""  // Empty field
    ].join("|")
  }

  generateBatchId(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '')
    return `DFT_${dateStr}_${timeStr}`
  }

  generateFileName(batchId: string): string {
    return `${batchId}.txt`
  }
}

export default DftModuleService
