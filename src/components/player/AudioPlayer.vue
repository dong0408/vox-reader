<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores'
import { useTTS } from '@/composables/useTTS'
import type { SpeechSegment } from '@/types'

interface Props {
  segments: SpeechSegment[]
  currentSegmentIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentSegmentIndex: 0,
})

const emit = defineEmits<{
  segmentChange: [index: number]
  play: []
  pause: []
}>()

const playerStore = usePlayerStore()
const { voices, selectedVoiceId, isLoading, error, initVoices, synthesizeSegment, clearCache } = useTTS()

const audioElement = ref<HTMLAudioElement | null>(null)
const currentTime = ref(0)
const duration = ref(0)
const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]

const currentSegment = computed(() => {
  return props.segments[props.currentSegmentIndex]
})

const isPlaying = computed(() => playerStore.isPlaying)

const progress = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const play = async () => {
  if (!currentSegment.value) return

  // 检查是否需要生成语音
  if (!currentSegment.value.audioUrl) {
    const result = await synthesizeSegment(currentSegment.value as any)
    if (!result || !result.audioUrl) {
      error.value = '无法生成语音，请重试'
      return
    }
    currentSegment.value.audioUrl = result.audioUrl || ''
  }

  if (audioElement.value && currentSegment.value.audioUrl) {
    try {
      audioElement.value.src = currentSegment.value.audioUrl
      await audioElement.value.play()
      playerStore.play()
      emit('play')
    } catch (err) {
      error.value = err instanceof Error ? err.message : '播放失败'
    }
  }
}

const pause = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    playerStore.pause()
    emit('pause')
  }
}

const togglePlayPause = async () => {
  if (isPlaying.value) {
    pause()
  } else {
    await play()
  }
}

const nextSegment = () => {
  if (props.currentSegmentIndex < props.segments.length - 1) {
    pause()
    emit('segmentChange', props.currentSegmentIndex + 1)
  }
}

const prevSegment = () => {
  if (props.currentSegmentIndex > 0) {
    pause()
    emit('segmentChange', props.currentSegmentIndex - 1)
  }
}

const setPlaybackRate = (rate: number) => {
  playerStore.setPlaybackRate(rate)
  if (audioElement.value) {
    audioElement.value.playbackRate = rate
  }
}

const handleTimeUpdate = () => {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime
  }
}

const handleLoadedMetadata = () => {
  if (audioElement.value) {
    duration.value = audioElement.value.duration
    playerStore.setDuration(duration.value)
  }
}

const handleEnded = () => {
  if (props.currentSegmentIndex < props.segments.length - 1) {
    nextSegment()
    play()
  } else {
    pause()
  }
}

const seek = (time: number) => {
  if (audioElement.value) {
    audioElement.value.currentTime = time
    playerStore.setCurrentTime(time)
  }
}

const handleProgressBarClick = (event: MouseEvent) => {
  if (!audioElement.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  seek(percent * duration.value)
}

onMounted(() => {
  initVoices()
})

onUnmounted(() => {
  clearCache()
})

watch(() => props.currentSegmentIndex, () => {
  pause()
  currentTime.value = 0
  duration.value = 0
})

watch(
  () => playerStore.playbackRate,
  (rate) => {
    if (audioElement.value) {
      audioElement.value.playbackRate = rate
    }
  },
)

watch(
  () => playerStore.volume,
  (vol) => {
    if (audioElement.value) {
      audioElement.value.volume = vol
    }
  },
)
</script>

<template>
  <div class="card space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">
      音频播放器
    </h3>

    <!-- 当前段落显示 -->
    <div v-if="currentSegment" class="bg-blue-50 p-3 rounded border border-blue-200">
      <div class="flex justify-between items-center mb-2">
        <p class="text-sm text-gray-600 font-medium">
          第 {{ currentSegmentIndex + 1 }} 段 / 共 {{ segments.length }} 段
        </p>
        <span class="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
          {{ Math.round((currentSegment.text.length / 100)) * 100 }} 字
        </span>
      </div>
      <p class="text-gray-700 text-sm leading-relaxed border-l-4 border-blue-400 pl-3">
        "{{ currentSegment.text }}"
      </p>
    </div>

    <!-- 声音选择 -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">
        选择声音
      </label>
      <select
        v-model="selectedVoiceId"
        :disabled="isLoading"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-100"
      >
        <option v-for="voice in voices" :key="voice.id" :value="voice.id">
          {{ voice.name }}
        </option>
      </select>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- 音频元素 -->
    <audio
      ref="audioElement"
      class="hidden"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    />

    <!-- 播放控制 -->
    <div class="space-y-3">
      <!-- 进度条 -->
      <div class="space-y-1">
        <div
          class="h-2 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition"
          @click="handleProgressBarClick"
        >
          <div
            class="h-full bg-primary rounded-full transition-all"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-600">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="flex items-center justify-center gap-4">
        <button
          :disabled="currentSegmentIndex === 0"
          @click="prevSegment"
          class="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="上一段"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.445 14.832A1 1 0 0 0 10 14v-4a1 1 0 0 0-1.555-.832l-3.5 2a1 1 0 0 0 0 1.664l3.5 2zM12 8a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1z" />
          </svg>
        </button>

        <button
          :disabled="isLoading"
          @click="togglePlayPause"
          class="px-6 py-2 rounded-full bg-primary text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          <span v-if="!isLoading" class="flex items-center gap-2">
            <svg v-if="!isPlaying" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 11-2 0 1 1 0 012 0zM7 12a1 1 0 11-2 0 1 1 0 012 0zm7-4a1 1 0 11-2 0 1 1 0 012 0zm0 4a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
            </svg>
            {{ isPlaying ? '暂停' : '播放' }}
          </span>
          <span v-else class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
            </svg>
            生成中...
          </span>
        </button>

        <button
          :disabled="currentSegmentIndex === segments.length - 1"
          @click="nextSegment"
          class="p-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="下一段"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11.555 5.168A1 1 0 0 0 10 6v4a1 1 0 0 0 1.555.832l3.5-2a1 1 0 0 0 0-1.664l-3.5-2zM8 12a1 1 0 0 0 1-1V5a1 1 0 1 0-2 0v6a1 1 0 0 0 1 1z" />
          </svg>
        </button>
      </div>

      <!-- 播放速度 -->
      <div class="space-y-2">
        <label class="text-xs font-medium text-gray-700">
          播放速度
        </label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="rate in playbackRates"
            :key="rate"
            :class="[
              'px-3 py-1 rounded text-sm transition',
              playerStore.playbackRate === rate
                ? 'bg-primary text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
            @click="setPlaybackRate(rate)"
          >
            {{ rate }}x
          </button>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="space-y-2">
        <label class="text-xs font-medium text-gray-700">
          音量: {{ Math.round(playerStore.volume * 100) }}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          :value="playerStore.volume"
          @input="playerStore.setVolume(Number(($event.target as HTMLInputElement).value))"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>
