<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTranslation } from '@/composables/useTranslation'
import { LANGUAGE_OPTIONS } from '@/lib/translation'

interface Props {
  text: string
  defaultSourceLanguage?: string
  defaultTargetLanguage?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultSourceLanguage: 'auto',
  defaultTargetLanguage: 'en',
})

const emit = defineEmits<{
  translated: [text: string]
}>()

const { translate, loading, error, clearError } = useTranslation()

const sourceLanguage = ref(props.defaultSourceLanguage)
const targetLanguage = ref(props.defaultTargetLanguage)
const translatedText = ref('')
const showTranslation = ref(false)

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

const canSwap = computed(() => sourceLanguage.value !== 'auto')
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

    <!-- Translation Result -->
    <div v-if="showTranslation && translatedText" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <p class="text-xs text-gray-600 mb-2 font-medium">📝 翻译结果：</p>
      <p class="text-gray-800 leading-relaxed">
        {{ translatedText }}
      </p>
    </div>
  </div>
</template>
