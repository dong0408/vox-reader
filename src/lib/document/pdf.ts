import type { DocumentParser, FileMetadata } from './parser'
import type { NormalizedDocument } from '@/types'
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export class PdfParser implements DocumentParser {
  supports(mimeType: string): boolean {
    return mimeType === 'application/pdf'
  }

  async parse(file: ArrayBuffer | string, metadata: FileMetadata): Promise<NormalizedDocument> {
    if (typeof file === 'string') {
      throw new Error('PDF parser requires ArrayBuffer')
    }

    const pdf = await pdfjs.getDocument({ data: file }).promise
    const blocks = []
    let blockIndex = 0

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      let currentParagraph = ''
      let currentY = 0

      for (const item of textContent.items) {
        if ('str' in item) {
          const text = item.str.trim()
          if (!text) continue

          // Detect new paragraphs based on vertical position changes
          const itemY = (item as any).y || 0
          if (currentY > 0 && Math.abs(itemY - currentY) > 5 && currentParagraph.trim()) {
            blocks.push({
              id: `block_${blockIndex++}`,
              type: 'paragraph' as const,
              text: currentParagraph.trim(),
              page: pageNum,
            })
            currentParagraph = ''
          }

          currentParagraph += (currentParagraph ? ' ' : '') + text
          currentY = itemY
        }
      }

      if (currentParagraph.trim()) {
        blocks.push({
          id: `block_${blockIndex++}`,
          type: 'paragraph' as const,
          text: currentParagraph.trim(),
          page: pageNum,
        })
      }
    }

    return {
      id: `doc_${Date.now()}`,
      title: metadata.filename?.replace(/\.pdf$/i, '') || 'Untitled PDF',
      sourceType: 'pdf',
      blocks: blocks.length > 0 ? blocks : [{
        id: 'block_0',
        type: 'paragraph' as const,
        text: 'No text content found in PDF',
      }],
      createdAt: new Date().toISOString(),
    }
  }
}
