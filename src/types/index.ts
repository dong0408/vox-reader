export interface NormalizedDocument {
  id: string
  title: string
  sourceType: 'pdf' | 'docx' | 'markdown' | 'txt' | 'image'
  blocks: DocumentBlock[]
  createdAt: string
}

export interface DocumentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code'
  text: string
  level?: number
  page?: number
}

export interface SpeechSegment {
  id: string
  documentId: string
  blockId: string
  index: number
  text: string
  audioUrl?: string
  duration?: number
  status: 'pending' | 'generating' | 'ready' | 'failed'
}

export interface Voice {
  id: string
  name: string
  provider: string
  type: 'system' | 'cloned'
  language?: string
}

export interface ReadingProgress {
  documentId: string
  segmentIndex: number
  audioTime: number
  updatedAt: string
}
