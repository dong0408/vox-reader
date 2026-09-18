import { ref, computed } from 'vue'
import { TranslationAPI, type TranslationCache } from '@/lib/translation'

export function useTranslation() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cache = ref<TranslationCache>({})

  const getCacheKey = (text: string, source: string, target: string): string => {
    return `${source}-${target}-${text}`
  }

  const clearError = () => {
    error.value = null
  }

  const translate = async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> => {
    if (!text.trim()) {
      return text
    }

    // Check cache
    const cacheKey = getCacheKey(text, sourceLanguage, targetLanguage)
    if (cache.value[cacheKey]) {
      return cache.value[cacheKey]
    }

    loading.value = true
    error.value = null

    try {
      const response = await TranslationAPI.translate({
        text,
        sourceLanguage,
        targetLanguage,
      })

      cache.value[cacheKey] = response.translatedText
      return response.translatedText
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Translation failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const batchTranslate = async (
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string[]> => {
    const nonEmptyTexts = texts.filter(t => t.trim())
    if (nonEmptyTexts.length === 0) {
      return texts
    }

    loading.value = true
    error.value = null

    try {
      const results = await TranslationAPI.batchTranslate(
        nonEmptyTexts,
        sourceLanguage,
        targetLanguage,
      )

      // Update cache
      results.forEach((result, index) => {
        const cacheKey = getCacheKey(nonEmptyTexts[index], sourceLanguage, targetLanguage)
        cache.value[cacheKey] = result
      })

      // Map back to original array including empty strings
      let resultIndex = 0
      return texts.map(text => {
        if (!text.trim()) {
          return text
        }
        return results[resultIndex++]
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Batch translation failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearCache = () => {
    cache.value = {}
  }

  const cacheSize = computed(() => Object.keys(cache.value).length)

  return {
    loading,
    error,
    cacheSize,
    translate,
    batchTranslate,
    clearError,
    clearCache,
  }
}
