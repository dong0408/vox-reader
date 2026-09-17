import type { TTSProvider, TTSRequest, TTSResult, TTSVoice } from '../types'

/**
 * Browser Speech Provider - 使用浏览器原生 Web Speech API
 * 这是推荐方案，无需依赖，支持真实语音合成
 */
export class BrowserSpeechProvider implements TTSProvider {
  private synth = window.speechSynthesis

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(request.text)

      // 设置语言
      utterance.lang = request.voiceId.includes('en') ? 'en-US' : 'zh-CN'
      utterance.rate = request.speed || 1
      utterance.pitch = 1
      utterance.volume = 1

      // 选择声音
      const availableVoices = this.synth.getVoices()
      const selectedVoice = availableVoices.find(
        (v) => v.name === request.voiceId || v.lang.startsWith(utterance.lang)
      )
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onend = () => {
        resolve({
          audio: new ArrayBuffer(0),
          format: 'web-speech',
          mimeType: 'audio/web-speech',
        })
      }

      utterance.onerror = (error) => {
        reject(new Error(`语音合成失败: ${error.error}`))
      }

      // 取消之前的语音并立即播放新的
      this.synth.cancel()
      this.synth.speak(utterance)
    })
  }

  async getAvailableVoices(): Promise<TTSVoice[]> {
    return new Promise((resolve) => {
      const voices = this.synth.getVoices()

      if (voices.length > 0) {
        resolve(this.mapVoices(voices))
        return
      }

      // 如果声音还没加载，等待 voiceschanged 事件
      this.synth.onvoiceschanged = () => {
        const loadedVoices = this.synth.getVoices()
        resolve(this.mapVoices(loadedVoices))
      }
    })
  }

  private mapVoices(browserVoices: SpeechSynthesisVoice[]): TTSVoice[] {
    // 优先显示中文和英文声音
    const zhVoices = browserVoices.filter((v) => v.lang.startsWith('zh'))
    const enVoices = browserVoices.filter((v) => v.lang.startsWith('en'))

    const displayVoices = [...zhVoices, ...enVoices]

    return displayVoices
      .slice(0, 8) // 最多显示 8 个声音
      .map((voice) => ({
        id: voice.name,
        name: `${voice.name} (${voice.lang})`,
        language: voice.lang,
        provider: 'web-speech',
      }))
  }
}

/**
 * Mock TTS Provider - 生成模拟音频（仅用于无声测试）
 * 注意：生成的是正弦波，会像噪音
 */
export class MockTTSProvider implements TTSProvider {
  private voices: TTSVoice[] = [
    {
      id: 'mock-female-zh',
      name: '模拟女声 (中文)',
      language: 'zh-CN',
      provider: 'mock',
    },
    {
      id: 'mock-male-zh',
      name: '模拟男声 (中文)',
      language: 'zh-CN',
      provider: 'mock',
    },
  ]

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    try {
      const audioBuffer = this.generateMockAudio(request.text, request.speed || 1)
      const duration = (request.text.length / 50) * (1 / (request.speed || 1))

      return {
        audio: audioBuffer,
        format: 'wav',
        duration,
        mimeType: 'audio/wav',
      }
    } catch (error) {
      throw new Error(`TTS 合成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async getAvailableVoices(): Promise<TTSVoice[]> {
    return this.voices
  }

  private generateMockAudio(text: string, speed: number): ArrayBuffer {
    const sampleRate = 16000
    const duration = (text.length / 50) * (1 / speed)
    const numSamples = Math.floor(sampleRate * duration)
    const audioData = new Float32Array(numSamples)

    for (let i = 0; i < numSamples; i++) {
      const frequency = 440 + (text.charCodeAt(i % text.length) % 100)
      const phase = (i / sampleRate) * frequency * 2 * Math.PI
      audioData[i] = 0.3 * Math.sin(phase)
    }

    return this.encodeWAV(audioData, sampleRate)
  }

  private encodeWAV(audioData: Float32Array, sampleRate: number): ArrayBuffer {
    const channelData = [audioData]
    const frame = this.interleave(...channelData)

    const WAV_HEADER_SIZE = 44
    const buffer = new ArrayBuffer(frame.length * 2 + WAV_HEADER_SIZE)
    const view = new DataView(buffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + frame.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, frame.length * 2, true)

    let offset = 44
    for (let i = 0; i < frame.length; i++) {
      view.setInt16(offset, frame[i] * 0x7fff, true)
      offset += 2
    }

    return buffer
  }

  private interleave(...arrays: Float32Array[]): Float32Array {
    const totalLength = arrays[0].length * arrays.length
    const result = new Float32Array(totalLength)
    const channelCount = arrays.length
    let offset = 0
    let arrayIndex = 0

    while (offset < totalLength) {
      for (let i = 0; i < channelCount; i++) {
        result[offset++] = arrays[i][arrayIndex]
      }
      arrayIndex++
    }
    return result
  }
}
