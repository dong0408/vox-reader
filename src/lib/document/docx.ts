import type { DocumentParser, FileMetadata } from './parser'
import type { NormalizedDocument } from '@/types'
import mammoth from 'mammoth'

export class DocxParser implements DocumentParser {
  supports(mimeType: string): boolean {
    return (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    )
  }

  async parse(file: ArrayBuffer | string, metadata: FileMetadata): Promise<NormalizedDocument> {
    if (typeof file === 'string') {
      throw new Error('DOCX parser requires ArrayBuffer')
    }

    try {
      const result = await (mammoth as any).convertToHtml({ arrayBuffer: file })
      const html = result.value

      // Convert HTML to plain text paragraphs
      const paragraphs = this.extractParagraphsFromHtml(html)

      const blocks = paragraphs
        .filter(p => p.trim())
        .map((para, index) => ({
          id: `block_${index}`,
          type: 'paragraph' as const,
          text: para.trim(),
        }))

      return {
        id: `doc_${Date.now()}`,
        title: metadata.filename?.replace(/\.(docx|doc)$/i, '') || 'Untitled Document',
        sourceType: 'docx',
        blocks: blocks.length > 0 ? blocks : [{
          id: 'block_0',
          type: 'paragraph',
          text: 'No text content found in document',
        }],
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`Failed to parse DOCX file: ${error}`)
    }
  }

  private extractParagraphsFromHtml(html: string): string[] {
    // Remove tags and split by paragraphs
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .split(/\n\s*\n+/)
      .map(p => p.trim())

    return text
  }
}
