<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentStore } from '@/stores'
import { chunkDocument } from '@/lib/chunker/textChunker'
import DocumentReader from '@/components/reader/DocumentReader.vue'
import TextTranslator from '@/components/translator/TextTranslator.vue'

interface WordRecord {
  word: string
  meaning: string
  timestamp: number
}

const route = useRoute()
const router = useRouter()
const store = useDocumentStore()

const documentId = computed(() => route.params.id as string)
const segments = ref<any[]>([])
const currentSegmentIndex = ref(0)
const showTranslator = ref(false)
const translatorRef = ref<InstanceType<typeof TextTranslator> | null>(null)
const wordRecords = ref<WordRecord[]>([])
const selectedWord = ref<WordRecord | null>(null)

const currentSegment = computed(() => {
  return segments.value[currentSegmentIndex.value]
})

const currentBlockId = computed(() => {
  return currentSegment.value?.blockId
})

onMounted(() => {
  if (!store.currentDocument) {
    router.push('/')
    return
  }

  // Generate segments for chunking
  if (store.currentDocument.id === documentId.value) {
    segments.value = chunkDocument(
      store.currentDocument.id,
      store.currentDocument.blocks,
    )
  }
})

const handleSegmentChange = (index: number) => {
  if (index >= 0 && index < segments.value.length) {
    currentSegmentIndex.value = index
  }
}

const handleWordAdded = (word: WordRecord) => {
  const records = translatorRef.value?.wordRecords
  if (records) {
    wordRecords.value = [...records]
  }
  selectedWord.value = word
}

const deleteWordRecord = (index: number) => {
  if (translatorRef.value?.deleteWordRecord) {
    translatorRef.value.deleteWordRecord(index)
  }
  const records = translatorRef.value?.wordRecords
  if (records) {
    wordRecords.value = [...records]
  }
}

const clearWordRecords = () => {
  if (translatorRef.value?.clearWordRecords) {
    translatorRef.value.clearWordRecords()
  }
  wordRecords.value = []
  selectedWord.value = null
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- 返回按钮 -->
      <router-link
        to="/"
        class="inline-flex items-center text-primary hover:text-opacity-80 mb-6"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </router-link>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 文档内容（左侧） -->
        <div class="lg:col-span-2">
          <div class="mb-8">
            <DocumentReader :active-block-id="currentBlockId" />
          </div>

          <!-- 分段导航 -->
          <div v-if="segments.length > 0" class="space-y-4 border-t pt-6">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <p class="text-2xl font-bold text-blue-600">{{ segments.length }}</p>
                <p class="text-sm text-gray-600 mt-1">段落总数</p>
              </div>
              <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                <p class="text-2xl font-bold text-purple-600">{{ currentSegmentIndex + 1 }}</p>
                <p class="text-sm text-gray-600 mt-1">当前段落</p>
              </div>
              <div class="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <p class="text-2xl font-bold text-green-600">{{ Math.round((currentSegment?.text.length || 0) / 10) }}</p>
                <p class="text-sm text-gray-600 mt-1">当前长度</p>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-600 mb-2 font-medium">📄 当前段落内容：</p>
              <p class="text-gray-700 leading-relaxed border-l-4 border-gray-400 pl-3">
                {{ currentSegment?.text }}
              </p>
            </div>

            <!-- 翻译器 -->
            <div class="border-t pt-4">
              <button
                @click="showTranslator = !showTranslator"
                class="flex items-center gap-2 px-4 py-2 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition font-medium"
              >
                {{ showTranslator ? '🔽' : '▶' }} 翻译文本
              </button>

              <div v-if="showTranslator" class="mt-4">
                <TextTranslator
                  ref="translatorRef"
                  :text="currentSegment?.text || ''"
                  defaultSourceLanguage="auto"
                  defaultTargetLanguage="en"
                  @wordAdded="handleWordAdded"
                />
              </div>
            </div>

            <!-- 进度条 -->
            <div class="bg-white p-3 rounded-lg border border-gray-200">
              <div class="flex justify-between text-xs text-gray-600 mb-2">
                <span>进度</span>
                <span>{{ Math.round(((currentSegmentIndex + 1) / segments.length) * 100) }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  :style="{ width: `${((currentSegmentIndex + 1) / segments.length) * 100}%` }"
                />
              </div>
            </div>

            <!-- 导航按钮 -->
            <div class="flex gap-4">
              <button
                :disabled="currentSegmentIndex === 0"
                @click="handleSegmentChange(currentSegmentIndex - 1)"
                class="flex-1 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ◀ 上一段
              </button>

              <button
                :disabled="currentSegmentIndex === segments.length - 1"
                @click="handleSegmentChange(currentSegmentIndex + 1)"
                class="flex-1 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                下一段 ▶
              </button>
            </div>
          </div>

          <div v-else class="text-center text-gray-500 py-8">
            <p>没有可显示的内容</p>
          </div>
        </div>

        <!-- 单词记录面板（右侧） -->
        <div v-if="segments.length > 0" class="lg:sticky lg:top-8">
          <div class="card space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                📚 单词记录
              </h3>
              <button
                v-if="wordRecords.length > 0"
                @click="clearWordRecords"
                class="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
              >
                清空
              </button>
            </div>

            <div v-if="wordRecords.length === 0" class="text-center text-gray-500 py-8">
              <p class="mb-2">双击翻译框中的单词</p>
              <p class="text-sm">即可添加到记录</p>
            </div>

            <div v-else class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="(record, index) in wordRecords"
                :key="record.timestamp"
                :class="[
                  'p-3 rounded-lg border-2 cursor-pointer transition',
                  selectedWord === record
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                ]"
                @click="selectedWord = record"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 break-words">
                      {{ record.word }}
                    </p>
                    <p class="text-sm text-gray-600 break-words">
                      {{ record.meaning }}
                    </p>
                  </div>
                  <button
                    @click.stop="deleteWordRecord(index)"
                    class="flex-shrink-0 px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>

            <!-- 选中单词的详细信息 -->
            <div v-if="selectedWord" class="border-t pt-4">
              <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <p class="text-xs text-gray-600 font-medium mb-2">选中单词详情</p>
                <div class="space-y-2">
                  <div>
                    <p class="text-xs text-gray-500">原文</p>
                    <p class="text-lg font-bold text-blue-600">{{ selectedWord.word }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">中文意思</p>
                    <p class="text-gray-700">{{ selectedWord.meaning }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

