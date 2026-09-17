<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '@/stores'

interface Props {
  activeBlockId?: string
}

withDefaults(defineProps<Props>(), {
  activeBlockId: '',
})

const store = useDocumentStore()

const displayBlocks = computed(() => {
  return store.currentDocument?.blocks ?? []
})
</script>

<template>
  <div class="space-y-4">
    <h1 v-if="store.currentDocument" class="text-3xl font-bold text-gray-900">
      {{ store.currentDocument.title }}
    </h1>

    <div v-if="displayBlocks.length === 0" class="text-center text-gray-500 py-8">
      <p>没有可显示的内容</p>
    </div>

    <div v-for="block in displayBlocks" :key="block.id" class="space-y-2">
      <h2
        v-if="block.type === 'heading'"
        :class="[
          'font-bold text-gray-900 transition-colors',
          block.level === 1 ? 'text-2xl mt-6 mb-3' : 'text-xl mt-4 mb-2',
          activeBlockId === block.id && 'bg-yellow-100 px-2 py-1 rounded',
        ]"
      >
        {{ block.text }}
      </h2>

      <p
        v-else-if="block.type === 'paragraph'"
        :class="[
          'text-gray-700 leading-relaxed transition-colors',
          activeBlockId === block.id && 'bg-yellow-100 px-2 py-1 rounded',
        ]"
      >
        {{ block.text }}
      </p>

      <div
        v-else-if="block.type === 'list'"
        :class="[
          'text-gray-700 ml-4 flex items-start transition-colors',
          activeBlockId === block.id && 'bg-yellow-100 px-2 py-1 rounded',
        ]"
      >
        <span class="mr-2">•</span>
        <span>{{ block.text }}</span>
      </div>

      <blockquote
        v-else-if="block.type === 'quote'"
        :class="[
          'text-gray-600 italic border-l-4 border-gray-300 pl-4 transition-colors',
          activeBlockId === block.id && 'bg-yellow-100 px-2 py-1 rounded',
        ]"
      >
        {{ block.text }}
      </blockquote>

      <pre
        v-else-if="block.type === 'code'"
        class="bg-gray-100 p-3 rounded overflow-x-auto text-sm"
      ><code>{{ block.text }}</code></pre>
    </div>
  </div>
</template>
