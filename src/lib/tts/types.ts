export interface TTSRequest {
  text: string
  voiceId: string
  speed?: number
  format?: 'mp3' | 'wav' | 'webm'
}

export interface TTSResult {
  audio: ArrayBuffer
  format: string
  duration?: number
  mimeType: string
  audioUrl?: string
}

export interface TTSProvider {
  synthesize(request: TTSRequest): Promise<TTSResult>
  getAvailableVoices(): Promise<TTSVoice[]>
}

export interface TTSVoice {
  id: string
  name: string
  language: string
  provider: string
}

export interface SynthesisProgress {
  status: 'pending' | 'generating' | 'ready' | 'failed'
  progress?: number
  error?: string
}

