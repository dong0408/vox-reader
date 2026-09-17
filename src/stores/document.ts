import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NormalizedDocument } from '@/types'

export const useDocumentStore = defineStore('document', () => {
  const currentDocument = ref<NormalizedDocument | null>(null)
  const documents = ref<NormalizedDocument[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasDocument = computed(() => !!currentDocument.value)

  const setDocument = (doc: NormalizedDocument) => {
    currentDocument.value = doc
  }

  const addDocument = (doc: NormalizedDocument) => {
    documents.value.push(doc)
  }

  const clearError = () => {
    error.value = null
  }

  return {
    currentDocument,
    documents,
    loading,
    error,
    hasDocument,
    setDocument,
    addDocument,
    clearError,
  }
})
