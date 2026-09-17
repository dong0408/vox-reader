import type { DocumentParser, FileMetadata } from './parser'
import type { NormalizedDocument, DocumentBlock } from '@/types'

export class MarkdownParser implements DocumentParser {
  supports(mimeType: string): boolean {
    return mimeType === 'text/markdown' || mimeType === 'text/plain'
  }

  async parse(file: ArrayBuffer | string, metadata: FileMetadata): Promise<NormalizedDocument> {
    let text: string

    if (typeof file === 'string') {
      text = file
    } else {
      const decoder = new TextDecoder()
      text = decoder.decode(file)
    }

    const lines = text.split('\n')
    const blocks = this.parseMarkdown(lines)

    return {
      id: `doc_${Date.now()}`,
      title: metadata.filename?.replace(/\.(md|txt)$/, '') || 'Untitled',
      sourceType: 'markdown' as const,
      blocks,
      createdAt: new Date().toISOString(),
    }
  }

  private parseMarkdown(lines: string[]): DocumentBlock[] {
    const blocks: DocumentBlock[] = []
    let currentParagraph = ''
    let blockId = 0

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed) {
        if (currentParagraph) {
          blocks.push({
            id: `block_${blockId++}`,
            type: 'paragraph',
            text: currentParagraph.trim(),
          })
          currentParagraph = ''
        }
        continue
      }

      if (trimmed.startsWith('# ')) {
        if (currentParagraph) {
          blocks.push({
            id: `block_${blockId++}`,
            type: 'paragraph',
            text: currentParagraph.trim(),
          })
          currentParagraph = ''
        }
        blocks.push({
          id: `block_${blockId++}`,
          type: 'heading',
          text: trimmed.replace(/^#+\s/, ''),
          level: trimmed.match(/^#+/)?.[0].length,
        })
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (currentParagraph) {
          blocks.push({
            id: `block_${blockId++}`,
            type: 'paragraph',
            text: currentParagraph.trim(),
          })
          currentParagraph = ''
        }
        blocks.push({
          id: `block_${blockId++}`,
          type: 'list',
          text: trimmed.replace(/^[-*]\s/, ''),
        })
      } else if (trimmed.startsWith('> ')) {
        if (currentParagraph) {
          blocks.push({
            id: `block_${blockId++}`,
            type: 'paragraph',
            text: currentParagraph.trim(),
          })
          currentParagraph = ''
        }
        blocks.push({
          id: `block_${blockId++}`,
          type: 'quote',
          text: trimmed.replace(/^>\s/, ''),
        })
      } else if (trimmed.startsWith('```')) {
        // Skip code blocks
        continue
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed
      }
    }

    if (currentParagraph) {
      blocks.push({
        id: `block_${blockId++}`,
        type: 'paragraph',
        text: currentParagraph.trim(),
      })
    }

    return blocks
  }
}
