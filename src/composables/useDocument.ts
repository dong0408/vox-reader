import { ref } from 'vue'
import { useDocumentStore } from '@/stores'
import { parseDocument } from '@/lib/document'
import type { NormalizedDocument } from '@/types'

export function useDocument() {
  const store = useDocumentStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const uploadDocument = async (file: File): Promise<NormalizedDocument | null> => {
    loading.value = true
    error.value = null

    try {
      const arrayBuffer = await file.arrayBuffer()
      const doc = await parseDocument(
        arrayBuffer,
        file.type || 'text/plain',
        file.name,
      )
      store.addDocument(doc)
      store.setDocument(doc)
      return doc
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse document'
      error.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
    store.clearError()
  }

  return {
    loading,
    error,
    uploadDocument,
    clearError,
  }
}
