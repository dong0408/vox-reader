import type { TTSProvider, TTSRequest, TTSResult, TTSVoice } from './types'
import { BrowserSpeechProvider } from './providers/mock'

let ttsProvider: TTSProvider | null = null

export function initTTSProvider(provider?: TTSProvider): void {
  if (provider) {
    ttsProvider = provider
  } else {
    // 默认使用浏览器 Web Speech API
    ttsProvider = new BrowserSpeechProvider()
  }
}

export function getTTSProvider(): TTSProvider {
  if (!ttsProvider) {
    initTTSProvider()
  }
  return ttsProvider!
}

export async function synthesize(request: TTSRequest): Promise<TTSResult> {
  const provider = getTTSProvider()
  return provider.synthesize(request)
}

export async function getAvailableVoices(): Promise<TTSVoice[]> {
  const provider = getTTSProvider()
  return provider.getAvailableVoices()
}

export type { TTSProvider, TTSRequest, TTSResult, TTSVoice }
