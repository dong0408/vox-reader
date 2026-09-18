<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslation } from '@/composables/useTranslation'
import { useTTS } from '@/composables/useTTS'
import { synthesize } from '@/lib/tts'
import { LANGUAGE_OPTIONS } from '@/lib/translation'

interface Props {
  text: string
  defaultSourceLanguage?: string
  defaultTargetLanguage?: string
}

interface WordRecord {
  word: string
  meaning: string
  timestamp: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultSourceLanguage: 'auto',
  defaultTargetLanguage: 'en',
})

const emit = defineEmits<{
  translated: [text: string]
  wordAdded: [word: WordRecord]
}>()

const { translate, loading, error, clearError } = useTranslation()
const { voices, selectedVoiceId, isLoading: isSynthesizing, initVoices } = useTTS()

const sourceLanguage = ref(props.defaultSourceLanguage)
const targetLanguage = ref(props.defaultTargetLanguage)
const translatedText = ref('')
const showTranslation = ref(false)
const playingSource = ref<'source' | 'target' | null>(null)
const currentAudio = ref<HTMLAudioElement | null>(null)
const playbackRate = ref(1)
const wordRecords = ref<WordRecord[]>([])
const selectedWord = ref<WordRecord | null>(null)

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

const handleTranslate = async () => {
  if (!props.text.trim()) {
    return
  }

  clearError()
  try {
    translatedText.value = await translate(props.text, sourceLanguage.value, targetLanguage.value)
    showTranslation.value = true
    emit('translated', translatedText.value)
  } catch (err) {
    console.error('Translation error:', err)
  }
}

const swapLanguages = () => {
  if (sourceLanguage.value !== 'auto') {
    const temp = sourceLanguage.value
    sourceLanguage.value = targetLanguage.value
    targetLanguage.value = temp
  }
}

const stopPlayback = () => {
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
    playingSource.value = null
  }
}

const playText = async (type: 'source' | 'target') => {
  if (playingSource.value === type) {
    stopPlayback()
    return
  }

  stopPlayback()

  const textToPlay = type === 'source' ? props.text : translatedText.value
  if (!textToPlay.trim()) return

  if (!selectedVoiceId.value) {
    if (voices.value.length === 0) {
      await initVoices()
    }
    if (voices.value.length === 0) return
  }

  playingSource.value = type
  try {
    const result = await synthesize({
      text: textToPlay,
      voiceId: selectedVoiceId.value,
    })

    if (result?.audio) {
      const blob = new Blob([result.audio], { type: result.mimeType })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      audio.playbackRate = playbackRate.value
      audio.onended = () => {
        playingSource.value = null
        currentAudio.value = null
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = () => {
        playingSource.value = null
        currentAudio.value = null
        URL.revokeObjectURL(audioUrl)
      }
      currentAudio.value = audio
      try {
        await audio.play()
      } catch (playErr) {
        console.error('Audio play error:', playErr)
        playingSource.value = null
        currentAudio.value = null
        URL.revokeObjectURL(audioUrl)
      }
    }
  } catch (err) {
    console.error('TTS error:', err)
    playingSource.value = null
  }
}

const setPlaybackRate = (rate: number) => {
  playbackRate.value = rate
  if (currentAudio.value) {
    currentAudio.value.playbackRate = rate
  }
}

const handleTextDoubleClick = () => {
  const selection = window.getSelection()?.toString().trim()
  if (selection && selection.length > 0) {
    addWordRecord(selection)
  }
}

const addWordRecord = (word: string) => {
  const meaning = translatedText.value.split(' ').find(w => w.toLowerCase().includes(word.toLowerCase())) || ''

  const record: WordRecord = {
    word: word,
    meaning: meaning || '(未找到翻译)',
    timestamp: Date.now()
  }

  selectedWord.value = record
  const existingIndex = wordRecords.value.findIndex(r => r.word === record.word)
  if (existingIndex === -1) {
    wordRecords.value.unshift(record)
  } else {
    wordRecords.value.splice(existingIndex, 1)
    wordRecords.value.unshift(record)
  }
  emit('wordAdded', record)
}

const deleteWordRecord = (index: number) => {
  if (selectedWord.value === wordRecords.value[index]) {
    selectedWord.value = null
  }
  wordRecords.value.splice(index, 1)
}

const clearWordRecords = () => {
  wordRecords.value = []
  selectedWord.value = null
}

const canSwap = computed(() => sourceLanguage.value !== 'auto')

defineExpose({
  wordRecords,
  selectedWord,
  deleteWordRecord,
  clearWordRecords,
})
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
    <!-- Language Selection -->
    <div class="flex gap-2 items-center">
      <select
        v-model="sourceLanguage"
        class="flex-1 px-3 py-2 rounded border border-gray-300 focus:border-primary focus:outline-none transition"
      >
        <option v-for="lang in LANGUAGE_OPTIONS" :key="lang.code" :value="lang.code">
          {{ lang.name }}
        </option>
      </select>

      <button
        :disabled="!canSwap || loading"
        @click="swapLanguages"
        class="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        title="交换语言"
      >
        ⇄
      </button>

      <select
        v-model="targetLanguage"
        class="flex-1 px-3 py-2 rounded border border-gray-300 focus:border-primary focus:outline-none transition"
      >
        <option v-for="lang in LANGUAGE_OPTIONS" :key="lang.code" :value="lang.code">
          {{ lang.name }}
        </option>
      </select>
    </div>

    <!-- Translate Button -->
    <button
      :disabled="!text.trim() || loading"
      @click="handleTranslate"
      class="w-full px-4 py-2 rounded bg-primary text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
    >
      {{ loading ? '翻译中...' : '翻译' }}
    </button>

    <!-- Error Message -->
    <div v-if="error" class="px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- Original and Translation Side by Side -->
    <div v-if="showTranslation && translatedText" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Original Text -->
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-300 flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs text-gray-600 font-medium">📄 原文</p>
          <div class="flex gap-2 items-center">
            <button
              :disabled="isSynthesizing || !text.trim()"
              @click="playText('source')"
              :class="[
                'px-2 py-1 rounded text-xs font-medium transition',
                playingSource === 'source'
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
              :title="playingSource === 'source' ? '暂停' : '朗读'"
            >
              {{ playingSource === 'source' ? '⏸ 暂停' : '🔊 朗读' }}
            </button>
          </div>
        </div>

        <!-- Playback Rate for Source -->
        <div v-if="playingSource === 'source'" class="flex gap-1 mb-3 flex-wrap">
          <button
            v-for="rate in playbackRates"
            :key="rate"
            :class="[
              'px-2 py-1 rounded text-xs transition',
              playbackRate === rate
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
            ]"
            @click="setPlaybackRate(rate)"
          >
            {{ rate }}x
          </button>
        </div>

        <p
          class="text-gray-700 leading-relaxed flex-1 cursor-text select-text"
          @dblclick="handleTextDoubleClick"
        >
          {{ text }}
        </p>
      </div>

      <!-- Translated Text -->
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-300 flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs text-gray-600 font-medium">📝 翻译 ({{ targetLanguage }})</p>
          <div class="flex gap-2 items-center">
            <button
              :disabled="isSynthesizing || !translatedText.trim()"
              @click="playText('target')"
              :class="[
                'px-2 py-1 rounded text-xs font-medium transition',
                playingSource === 'target'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              ]"
              :title="playingSource === 'target' ? '暂停' : '朗读'"
            >
              {{ playingSource === 'target' ? '⏸ 暂停' : '🔊 朗读' }}
            </button>
          </div>
        </div>

        <!-- Playback Rate for Target -->
        <div v-if="playingSource === 'target'" class="flex gap-1 mb-3 flex-wrap">
          <button
            v-for="rate in playbackRates"
            :key="rate"
            :class="[
              'px-2 py-1 rounded text-xs transition',
              playbackRate === rate
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200',
            ]"
            @click="setPlaybackRate(rate)"
          >
            {{ rate }}x
          </button>
        </div>

        <p
          class="text-gray-700 leading-relaxed flex-1 cursor-text select-text"
          @dblclick="handleTextDoubleClick"
        >
          {{ translatedText }}
        </p>
      </div>
    </div>
  </div>
</template>