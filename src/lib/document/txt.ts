import type { DocumentParser, FileMetadata } from './parser'
import type { NormalizedDocument } from '@/types'

export class TxtParser implements DocumentParser {
  supports(mimeType: string): boolean {
    return mimeType === 'text/plain'
  }

  async parse(file: ArrayBuffer | string, metadata: FileMetadata): Promise<NormalizedDocument> {
    let text: string

    if (typeof file === 'string') {
      text = file
    } else {
      const decoder = new TextDecoder()
      text = decoder.decode(file)
    }

    const paragraphs = text.split(/\n\n+/).filter((p: string) => p.trim())

    const blocks = paragraphs.map((para: string, index: number) => ({
      id: `block_${index}`,
      type: 'paragraph' as const,
      text: para.trim(),
    }))

    return {
      id: `doc_${Date.now()}`,
      title: metadata.filename?.replace(/\.txt$/, '') || 'Untitled',
      sourceType: 'txt' as const,
      blocks,
      createdAt: new Date().toISOString(),
    }
  }
}
