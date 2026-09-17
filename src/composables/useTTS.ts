import { ref, computed } from 'vue'
import { synthesize, getAvailableVoices } from '@/lib/tts'
import type { TTSVoice, TTSResult } from '@/lib/tts'
import type { SpeechSegment } from '@/types'

interface AudioSegment extends SpeechSegment {
  audioData?: ArrayBuffer
  audioUrl?: string
}

export function useTTS() {
  const voices = ref<TTSVoice[]>([])
  const selectedVoiceId = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const synthesizingSegmentId = ref<string | null>(null)

  // 缓存生成的音频
  const audioCache = new Map<string, TTSResult>()

  // 初始化
  const initVoices = async () => {
    try {
      const availableVoices = await getAvailableVoices()
      voices.value = availableVoices
      if (availableVoices.length > 0) {
        selectedVoiceId.value = availableVoices[0].id
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load voices'
    }
  }

  // 生成语音
  const synthesizeSegment = async (segment: AudioSegment): Promise<TTSResult | null> => {
    if (!selectedVoiceId.value) {
      error.value = 'Please select a voice first'
      return null
    }

    // 检查缓存
    const cacheKey = `${segment.text}_${selectedVoiceId.value}`
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey) || null
    }

    isLoading.value = true
    error.value = null
    synthesizingSegmentId.value = segment.id

    try {
      const result = await synthesize({
        text: segment.text,
        voiceId: selectedVoiceId.value,
      })

      // 创建 Blob URL
      const blob = new Blob([result.audio], { type: result.mimeType })
      const audioUrl = URL.createObjectURL(blob)

      const resultWithUrl: TTSResult = Object.assign({}, result, { audioUrl })

      // 缓存结果
      audioCache.set(cacheKey, resultWithUrl)

      return resultWithUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'TTS synthesis failed'
      return null
    } finally {
      isLoading.value = false
      synthesizingSegmentId.value = null
    }
  }

  // 清空缓存
  const clearCache = () => {
    audioCache.forEach((result) => {
      if (result.audioUrl) {
        URL.revokeObjectURL(result.audioUrl)
      }
    })
    audioCache.clear()
  }

  const isSynthesizing = computed(() => isLoading.value)

  return {
    voices,
    selectedVoiceId,
    isLoading: isSynthesizing,
    error,
    synthesizingSegmentId,
    initVoices,
    synthesizeSegment,
    clearCache,
  }
}
