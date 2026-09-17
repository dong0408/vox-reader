# TTS 文字转语音功能实现说明

## ✅ 已完成的功能

### 1. TTS 系统架构
- **TTS Provider 接口** - 抽象层，支持多个 TTS 提供者
- **Mock TTS 提供者** - 用于开发测试，无需外部 API
- **Web Speech API** - 浏览器原生语音合成（可选）
- **音频缓存系统** - 自动缓存合成的语音，避免重复生成

### 2. 核心文件

```
src/lib/tts/
├── types.ts                    # TTS 相关类型定义
├── index.ts                    # TTS 管理器
└── providers/
    └── mock.ts                 # Mock TTS 实现

src/composables/
└── useTTS.ts                   # TTS composable

src/components/player/
└── AudioPlayer.vue             # 音频播放器组件
```

### 3. 功能列表

✅ **已实现**
- 文字转语音合成
- 多个声音选择
- 音频播放/暂停/续播
- 进度条拖拽
- 播放速度调节（0.5x - 2x）
- 音量控制
- 分段导航（上一段/下一段）
- 自动播放下一段
- 音频缓存（避免重复生成）
- 错误提示

## 使用方法

### 1. 启动应用
```bash
npm run dev
```

### 2. 使用流程
1. 上传文档（支持 .txt、.md）
2. 进入阅读页面
3. 点击"显示播放器"
4. 选择声音（默认中文女声）
5. 点击播放按钮
6. 自动生成语音并播放

### 3. 播放器控制

**基本控制**
- ▶ 播放 / ⏸ 暂停
- ◀ 上一段 / ▶ 下一段
- 拖拽进度条跳转

**调节参数**
- 播放速度：0.5x ~ 2x
- 音量：0% ~ 100%
- 声音选择：中文女声、中文男声等

## 架构设计

### Provider Pattern（提供者模式）
```typescript
interface TTSProvider {
  synthesize(request: TTSRequest): Promise<TTSResult>
  getAvailableVoices(): Promise<TTSVoice[]>
}
```

这样设计的好处：
- 易于切换 TTS 服务（ElevenLabs → OpenAI → 自建等）
- 不修改业务代码就能更换提供者
- 便于测试（使用 Mock 实现）

### 默认实现

当前使用 **MockTTSProvider**，生成简单的 WAV 格式音频。这是用于开发测试的实现。

## 集成真实 TTS 服务

### 选项 1：ElevenLabs（推荐）

#### 1. 安装依赖
```bash
npm install elevenlabs
```

#### 2. 创建 ElevenLabs 实现
```typescript
// src/lib/tts/providers/elevenlabs.ts
import { ElevenLabsClient } from 'elevenlabs'
import type { TTSProvider, TTSRequest, TTSResult } from '../types'

export class ElevenLabsTTSProvider implements TTSProvider {
  private client: ElevenLabsClient

  constructor(apiKey: string) {
    this.client = new ElevenLabsClient({ apiKey })
  }

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    const audio = await this.client.generate({
      voice: request.voiceId,
      text: request.text,
      model_id: 'eleven_monolingual_v1',
    })

    return {
      audio: audio,
      format: 'mp3',
      mimeType: 'audio/mpeg',
    }
  }

  async getAvailableVoices() {
    // 获取 ElevenLabs 提供的所有声音
  }
}
```

#### 3. 初始化
```typescript
// src/main.ts
import { initTTSProvider } from '@/lib/tts'
import { ElevenLabsTTSProvider } from '@/lib/tts/providers/elevenlabs'

const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
if (apiKey) {
  initTTSProvider(new ElevenLabsTTSProvider(apiKey))
}
```

### 选项 2：OpenAI TTS

#### 1. 安装依赖
```bash
npm install openai
```

#### 2. 创建 OpenAI 实现
```typescript
// src/lib/tts/providers/openai.ts
import { OpenAI } from 'openai'
import type { TTSProvider, TTSRequest, TTSResult } from '../types'

export class OpenAITTSProvider implements TTSProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    const response = await this.client.audio.speech.create({
      model: 'tts-1',
      voice: request.voiceId as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      input: request.text,
      speed: request.speed || 1,
    })

    const arrayBuffer = await response.arrayBuffer()
    return {
      audio: arrayBuffer,
      format: 'mp3',
      mimeType: 'audio/mpeg',
    }
  }

  async getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', language: 'en-US', provider: 'openai' },
      { id: 'echo', name: 'Echo', language: 'en-US', provider: 'openai' },
      { id: 'fable', name: 'Fable', language: 'en-US', provider: 'openai' },
      { id: 'onyx', name: 'Onyx', language: 'en-US', provider: 'openai' },
      { id: 'nova', name: 'Nova', language: 'en-US', provider: 'openai' },
      { id: 'shimmer', name: 'Shimmer', language: 'en-US', provider: 'openai' },
    ]
  }
}
```

### 选项 3：Web Speech API（浏览器原生）

```typescript
// 在 useTTS.ts 中切换
import { WebSpeechProvider } from '@/lib/tts/providers/mock'

export function useTTS() {
  // ...
  const initVoices = async () => {
    try {
      const provider = new WebSpeechProvider()
      const availableVoices = await provider.getAvailableVoices()
      // ...
    }
  }
}
```

## 环境变量配置

```env
# .env
VITE_TTS_PROVIDER=mock              # 使用的 TTS 提供者
VITE_ELEVENLABS_API_KEY=your_key    # ElevenLabs API Key
VITE_OPENAI_API_KEY=your_key        # OpenAI API Key
```

## 性能优化

### 音频缓存
- 相同文本 + 相同声音 = 使用缓存
- 自动生成 Blob URL，减少网络请求
- 页面卸载时自动释放资源

### 分段生成
- 支持批量生成（可选）
- 一次一段，不阻塞 UI
- 显示生成进度

## 已知限制

### Mock 版本
- 生成的音频是模拟的正弦波，不是真实语音
- 用于开发测试，生产环境需要真实 TTS 服务

### 浏览器兼容性
- Web Speech API: Chrome/Edge/Safari 支持
- AudioContext: 所有现代浏览器支持

## 下一步改进

- [ ] 实现后端 TTS 服务
- [ ] 支持更多 TTS 提供者
- [ ] 添加词级时间戳同步
- [ ] 实现语速自适应
- [ ] 添加情感控制
- [ ] 支持多语言

## 测试

### 本地测试
```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器
# http://localhost:5173

# 3. 上传测试文件
# 使用 example.md 或 example.txt

# 4. 点击显示播放器
# 选择声音并点击播放

# 5. 查看浏览器控制台是否有错误
```

### 调试
- 打开浏览器开发者工具（F12）
- 查看 Console 标签页面的错误信息
- 查看 Network 标签页面的 API 调用

## 相关文档

- [TTS 类型定义](./src/lib/tts/types.ts)
- [TTS 管理器](./src/lib/tts/index.ts)
- [Mock 实现](./src/lib/tts/providers/mock.ts)
- [useTTS Composable](./src/composables/useTTS.ts)
- [AudioPlayer 组件](./src/components/player/AudioPlayer.vue)

---

**状态**：✅ 基础 TTS 系统完成  
**下一步**：集成真实 TTS 服务（用户自行选择）
