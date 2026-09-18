import type { TranslationRequest, TranslationResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export class TranslationAPI {
  static async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Translation API call failed:', error)
      throw error
    }
  }

  static async batchTranslate(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/translate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          sourceLanguage,
          targetLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error(`Batch translation API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.translatedTexts
    } catch (error) {
      console.error('Batch translation API call failed:', error)
      throw error
    }
  }
}
