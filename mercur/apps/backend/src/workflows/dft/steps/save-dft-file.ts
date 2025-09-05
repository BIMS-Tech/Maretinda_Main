import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { promises as fs } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

type SaveDftFileInput = {
  batch_id: string
  file_name: string
  file_content: string
  metadata: any
}

type SaveDftFileOutput = {
  file_path: string
  file_size: number
  checksum: string
}

export const saveDftFileStep = createStep(
  "save-dft-file",
  async (input: SaveDftFileInput) => {
    try {
      // Create DFT files directory if it doesn't exist
      const dftDir = join(process.cwd(), 'uploads', 'dft')
      await fs.mkdir(dftDir, { recursive: true })

      // Generate file path
      const filePath = join(dftDir, input.file_name)

      // Save file content
      await fs.writeFile(filePath, input.file_content, 'utf8')

      // Calculate file size
      const stats = await fs.stat(filePath)
      const fileSize = stats.size

      // Generate checksum
      const hash = createHash('md5')
      hash.update(input.file_content)
      const checksum = hash.digest('hex')

      // Save metadata file
      const metadataPath = join(dftDir, `${input.batch_id}_metadata.json`)
      await fs.writeFile(
        metadataPath, 
        JSON.stringify({
          ...input.metadata,
          file_path: filePath,
          file_size: fileSize,
          checksum: checksum,
          saved_at: new Date().toISOString()
        }, null, 2), 
        'utf8'
      )

      return new StepResponse({
        file_path: filePath,
        file_size: fileSize,
        checksum: checksum
      })

    } catch (error) {
      throw new Error(`Failed to save DFT file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
  async (output: SaveDftFileOutput) => {
    // Cleanup on failure - remove created files
    try {
      if (output.file_path) {
        await fs.unlink(output.file_path)
      }
    } catch (error) {
      console.error('Failed to cleanup DFT file:', error)
    }
  }
)
