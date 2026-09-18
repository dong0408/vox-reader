<script setup lang="ts">
import { ref } from 'vue'
import { useDocument } from '@/composables/useDocument'
import { useRouter } from 'vue-router'

const router = useRouter()
const { uploadDocument, loading, error } = useDocument()

const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)

const supportedFormats = ['.txt', '.md', '.markdown', '.pdf', '.doc', '.docx']

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    await processFile(target.files[0])
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  dragActive.value = true
}

const handleDragLeave = () => {
  dragActive.value = false
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  dragActive.value = false

  if (event.dataTransfer?.files?.length) {
    await processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file: File) => {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!supportedFormats.includes(ext)) {
    error.value = `Unsupported file format. Supported: ${supportedFormats.join(', ')}`
    return
  }

  const doc = await uploadDocument(file)
  if (doc) {
    router.push(`/reader/${doc.id}`)
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="card">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-900">
          VoxReader
        </h1>

        <p class="text-center text-gray-600 mb-6">
          将文档转换为自然语音
        </p>

        <div
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition',
            dragActive
              ? 'border-primary bg-blue-50'
              : 'border-gray-300 hover:border-primary',
          ]"
          @click="triggerFileInput"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>

          <p class="text-gray-700 font-medium mb-1">
            拖放文件或点击上传
          </p>

          <p class="text-sm text-gray-500">
            支持: {{ supportedFormats.join(', ') }}
          </p>
        </div>

        <input
          ref="fileInput"
          type="file"
          hidden
          :accept="supportedFormats.join(',')"
          @change="handleFileSelect"
        />

        <button
          v-if="!loading"
          @click="triggerFileInput"
          class="btn-primary w-full mt-6"
        >
          选择文件
        </button>

        <div v-else class="mt-6 text-center">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <p class="text-sm text-gray-600 mt-2">处理中...</p>
        </div>

        <div
          v-if="error"
          class="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
        >
          {{ error }}
        </div>
      </div>

      <div class="mt-8 text-center text-sm text-gray-600">
        <p>支持的格式: PDF, Word (DOC/DOCX), Markdown, TXT</p>
      </div>
    </div>
  </div>
</template>
