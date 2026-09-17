import type { NormalizedDocument } from '@/types'

export interface DocumentParser {
  supports(mimeType: string): boolean
  parse(file: ArrayBuffer | string, metadata: FileMetadata): Promise<NormalizedDocument>
}

export interface FileMetadata {
  mimeType: string
  filename?: string
}
