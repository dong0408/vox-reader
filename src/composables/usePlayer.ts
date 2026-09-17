import { ref, watch } from 'vue'
import { usePlayerStore } from '@/stores'

export function usePlayer() {
  const store = usePlayerStore()
  const audioElement = ref<HTMLAudioElement | null>(null)

  const play = async () => {
    if (audioElement.value) {
      await audioElement.value.play()
      store.play()
    }
  }

  const pause = () => {
    if (audioElement.value) {
      audioElement.value.pause()
      store.pause()
    }
  }

  const seek = (time: number) => {
    if (audioElement.value) {
      audioElement.value.currentTime = time
      store.setCurrentTime(time)
    }
  }

  const setPlaybackRate = (rate: number) => {
    if (audioElement.value) {
      audioElement.value.playbackRate = rate
    }
    store.setPlaybackRate(rate)
  }

  const setVolume = (volume: number) => {
    if (audioElement.value) {
      audioElement.value.volume = Math.max(0, Math.min(1, volume))
    }
    store.setVolume(volume)
  }

  watch(
    () => store.playbackRate,
    (rate) => {
      if (audioElement.value) {
        audioElement.value.playbackRate = rate
      }
    },
  )

  watch(
    () => store.volume,
    (vol) => {
      if (audioElement.value) {
        audioElement.value.volume = vol
      }
    },
  )

  return {
    audioElement,
    play,
    pause,
    seek,
    setPlaybackRate,
    setVolume,
  }
}
