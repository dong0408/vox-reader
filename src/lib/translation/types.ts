export interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  projectId?: number
}

export interface TranslationResponse {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
}

export interface TranslationCache {
  [key: string]: string
}

export const LANGUAGE_OPTIONS = [
  { code: 'auto', name: '自动检测' },
  { code: 'zh', name: '简体中文' },
  { code: 'zh-TW', name: '繁体中文' },
  { code: 'en', name: '英文' },
  { code: 'ja', name: '日文' },
  { code: 'ko', name: '韩文' },
  { code: 'es', name: '西班牙文' },
  { code: 'fr', name: '法文' },
  { code: 'de', name: '德文' },
  { code: 'tr', name: '土耳其文' },
  { code: 'ru', name: '俄文' },
  { code: 'pt', name: '葡萄牙文' },
  { code: 'vi', name: '越南文' },
  { code: 'ms', name: '马来西亚文' },
  { code: 'th', name: '泰文' },
  { code: 'ar', name: '阿拉伯文' },
  { code: 'hi', name: '印地文' },
  { code: 'it', name: '意大利文' },
]
