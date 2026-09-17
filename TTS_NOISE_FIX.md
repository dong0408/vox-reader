# TTS 噪音问题修复说明

## 问题
之前使用的 Mock TTS 提供者生成的是**正弦波模拟音频**，听起来像噪音，而不是真实的语音。

## 解决方案
已改为使用**浏览器原生 Web Speech API**（BrowserSpeechProvider），这样可以生成真实的语音朗读。

## 变更内容

### 1. 更新 TTS 提供者 (`src/lib/tts/providers/mock.ts`)
- ✅ 新增 `BrowserSpeechProvider` 类
- ✅ 使用浏览器原生 `SpeechSynthesisUtterance` API
- ✅ 支持多语言和多个声音
- ✅ 保留 `MockTTSProvider` 作为备选

### 2. 修改 TTS 管理器 (`src/lib/tts/index.ts`)
- ✅ 默认改为使用 `BrowserSpeechProvider`
- ✅ 不再使用 Mock 版本

## 现在的工作流程

```
用户点击播放
    ↓
BrowserSpeechProvider.synthesize()
    ↓
window.speechSynthesis.speak()
    ↓
浏览器使用系统语音引擎
    ↓
真实语音朗读
```

## 功能改进

### 真实语音
- ✅ 不再是噪音，而是清晰的语音
- ✅ 支持中文和英文自动识别
- ✅ 自动选择最合适的系统声音

### 可用声音
- ✅ 自动检测系统安装的语音包
- ✅ Windows: 支持多个内置声音
- ✅ macOS: 支持 Siri 声音
- ✅ Linux: 支持系统语音

### 播放速度
- ✅ 支持 0.5x ~ 2x 调节
- ✅ 实时应用，无需重新生成

## 如何测试

### 1. 启动应用
```bash
npm run dev
```

### 2. 打开浏览器
访问 http://localhost:5173

### 3. 上传文件并播放
1. 创建或上传 `.txt` 或 `.md` 文件
2. 点击"显示播放器"
3. 点击 ▶ 播放按钮
4. **现在应该能听到清晰的语音朗读**，而不是噪音

## 浏览器兼容性

| 浏览器 | 支持度 | 备注 |
|--------|--------|------|
| Chrome | ✅ 完全支持 | 推荐 |
| Edge | ✅ 完全支持 | 推荐 |
| Firefox | ✅ 完全支持 | 推荐 |
| Safari | ✅ 完全支持 | macOS/iOS |
| 其他 | ⚠️ 部分支持 | 具体取决于浏览器 |

## 高级选项

### 切换回 Mock 版本（如需要）
```typescript
// src/main.ts
import { initTTSProvider } from '@/lib/tts'
import { MockTTSProvider } from '@/lib/tts/providers/mock'

// 使用 Mock 版本
initTTSProvider(new MockTTSProvider())
```

### 集成真实 TTS 服务
如果需要更多功能（如离线使用、云端保存等），可以：
1. 集成 ElevenLabs（`npm install elevenlabs`）
2. 集成 OpenAI TTS（`npm install openai`）
3. 自建 TTS 服务

详见 `TTS_IMPLEMENTATION.md`

## 性能

- **无延迟**：直接使用浏览器引擎，无需网络请求
- **无费用**：使用系统内置语音，完全免费
- **低资源**：不占用额外内存

## 限制

- 依赖系统安装的语音包
- 无法保存音频文件（Web Speech API 不支持）
- 无法离线使用（需要浏览器和系统支持）

## 下一步

如果需要：
- **离线语音**：集成本地 TTS 库
- **高质量音频**：使用 ElevenLabs 或 OpenAI
- **多语言**：扩展声音列表
- **保存音频**：实现后端 TTS 服务

---

**修复状态**：✅ 完成  
**编译状态**：✅ 通过  
**测试状态**：🚀 可立即测试
