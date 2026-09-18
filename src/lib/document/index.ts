import type { DocumentParser } from './parser'
import type { NormalizedDocument } from '@/types'
import { MarkdownParser } from './markdown'
import { TxtParser } from './txt'
import { PdfParser } from './pdf'
import { DocxParser } from './docx'

const parsers: DocumentParser[] = [
  new PdfParser(),
  new DocxParser(),
  new MarkdownParser(),
  new TxtParser(),
]

export async function parseDocument(
  file: ArrayBuffer | string,
  mimeType: string,
  filename?: string,
): Promise<NormalizedDocument> {
  const parser = parsers.find(p => p.supports(mimeType))

  if (!parser) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  return parser.parse(file, { mimeType, filename })
}

export function getSupportedMimeTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
  ]
}
