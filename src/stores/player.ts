import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  const isPlaying = ref(false)
  const currentSegmentIndex = ref(0)
  const currentTime = ref(0)
  const duration = ref(0)
  const playbackRate = ref(1)
  const volume = ref(1)

  const progress = computed(() => {
    return duration.value ? (currentTime.value / duration.value) * 100 : 0
  })

  const play = () => {
    isPlaying.value = true
  }

  const pause = () => {
    isPlaying.value = false
  }

  const setPlaybackRate = (rate: number) => {
    playbackRate.value = rate
  }

  const setVolume = (vol: number) => {
    volume.value = Math.max(0, Math.min(1, vol))
  }

  const setCurrentTime = (time: number) => {
    currentTime.value = time
  }

  const setDuration = (dur: number) => {
    duration.value = dur
  }

  return {
    isPlaying,
    currentSegmentIndex,
    currentTime,
    duration,
    playbackRate,
    volume,
    progress,
    play,
    pause,
    setPlaybackRate,
    setVolume,
    setCurrentTime,
    setDuration,
  }
})
