// 临时禁用翻译功能
import type { TranslationRequest, TranslationResponse } from './types'

export class TranslationAPI {
  static async translate(request: TranslationRequest): Promise<TranslationResponse> {
    // ⚠️ 临时禁用翻译
    // 返回原文而不是翻译
    return {
      translatedText: request.text,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
    }
  }

  static async batchTranslate(
    texts: string[],
    _sourceLanguage: string,
    _targetLanguage: string,
  ): Promise<string[]> {
    // 临时返回原文
    return texts
  }
}
