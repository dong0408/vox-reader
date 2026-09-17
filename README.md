# VoxReader - AI 文档语音阅读器

一个可以将 PDF、Word、Markdown、TXT、图片等内容转换成自然语音的 AI 阅读应用。

[完整技术设计文档](../VoxDoc-Vue3.md)

## 快速开始

### 1. 启动开发服务器

```bash
cd vox-reader
npm run dev
```

然后在浏览器中打开 http://localhost:5173

### 2. 功能测试

**首页（文件上传）**
- 拖放上传支持的文件格式
- 或点击区域选择文件
- 支持格式：`.txt`, `.md`

**阅读页面**
- 自动解析文档内容
- 查看文档分段信息
- 上一段/下一段导航

### 3. 构建生产版本

```bash
npm run build      # 生产构建
npm run preview    # 预览构建结果
```

## 已支持的文件格式

| 格式 | 状态 | 说明 |
|------|------|------|
| `.txt` | ✅ 已支持 | 纯文本文件 |
| `.md` | ✅ 已支持 | Markdown 文档 |
| `.docx` | 🚧 开发中 | 需要 mammoth 库 |
| `.pdf` | 🚧 开发中 | 需要 pdf-parse 库 |
| `.jpg/.png` | 🚧 开发中 | 需要 OCR 库 |

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── uploader/       # 文件上传
│   ├── reader/         # 文档阅读器
│   └── player/         # 音频播放器（待实现）
├── stores/             # Pinia 状态管理
├── composables/        # 逻辑复用
├── services/           # API 服务层（待实现）
├── lib/                # 工具库
│   ├── document/       # 文档解析
│   ├── chunker/        # 文本分块
│   ├── ocr/            # OCR（待实现）
│   ├── tts/            # TTS（待实现）
│   └── utils/          # 工具函数
├── types/              # TypeScript 类型
├── router/             # 路由配置
├── pages/              # 页面组件
└── styles/             # 全局样式
```

## 核心功能模块

### 文档解析 (`src/lib/document/`)
- ✅ Markdown 解析器
- ✅ TXT 解析器
- ✅ 通用 DocumentParser 接口
- 🚧 DOCX 解析器
- 🚧 PDF 解析器

### 文本分块 (`src/lib/chunker/`)
- ✅ 智能文本分块
- ✅ 按字符长度和句子边界分割
- ✅ 生成 SpeechSegment 列表

### 文件上传 (`src/components/uploader/`)
- ✅ 拖放上传
- ✅ 点击上传
- ✅ 文件格式校验
- ✅ 错误提示

### 文档阅读器 (`src/components/reader/`)
- ✅ 多类型文本渲染（标题、段落、列表等）
- ✅ 当前段落高亮
- 🚧 段落级同步（TTS 播放时）

### 播放器 (`src/components/player/`)
- 🚧 音频播放
- 🚧 进度控制
- 🚧 播放速度调节
- 🚧 声音选择

## 配置文件

### 环境变量 (`.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_TTS_PROVIDER=mock
VITE_MAX_UPLOAD_SIZE_MB=50
```

参考 `.env.example` 创建自己的 `.env` 文件。

### TypeScript (`tsconfig.app.json`)
- ✅ Strict mode 启用
- ✅ Path aliases 配置 (@/ -> src/)
- ✅ Node types 支持

### UnoCSS (`uno.config.ts`)
- ✅ Tailwind CSS 兼容的原子化 CSS
- ✅ 自定义快捷方式（btn-primary, card 等）
- ✅ 深色模式支持

## 开发工作流

### 1. 添加新的文档格式支持

例如添加 DOCX 支持：

```typescript
// src/lib/document/docx.ts
import type { DocumentParser } from './parser'

export class DocxParser implements DocumentParser {
  supports(mimeType: string): boolean {
    return mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  async parse(file: Buffer, metadata: FileMetadata): Promise<NormalizedDocument> {
    // 实现解析逻辑
  }
}
```

然后在 `src/lib/document/index.ts` 注册：
```typescript
import { DocxParser } from './docx'

const parsers: DocumentParser[] = [
  new MarkdownParser(),
  new TxtParser(),
  new DocxParser(),  // 添加新的解析器
]
```

### 2. 实现 TTS 功能

```typescript
// src/lib/tts/providers/elevenlabs.ts
import type { TTSProvider } from '../index'

export class ElevenLabsTTSProvider implements TTSProvider {
  async synthesize(request: TTSRequest): Promise<TTSResult> {
    // 调用 ElevenLabs API
  }
}
```

### 3. 添加 Composable

```typescript
// src/composables/useTTS.ts
export function useTTS() {
  const store = useTTSStore()
  
  const synthesize = async (segment: SpeechSegment) => {
    // TTS 逻辑
  }
  
  return { synthesize }
}
```

## 依赖管理

### 已安装
- `vue@3` - Vue 框架
- `vite` - 构建工具
- `typescript` - 类型检查
- `pinia` - 状态管理
- `vue-router` - 路由
- `unocss` - 样式方案
- `@vueuse/core` - 工具函数库

### 需要手动安装（按需）

**文档解析：**
```bash
npm install mammoth pdf-parse
npm install -D @types/pdf-parse
```

**OCR：**
```bash
npm install tesseract.js
```

**TTS：**
```bash
npm install elevenlabs  # ElevenLabs
# 或
npm install openai     # OpenAI
```

## 常见问题

### Q: 如何切换 TTS 提供者？
A: 修改环境变量 `VITE_TTS_PROVIDER`，然后在应用初始化时导入对应的实现。

### Q: 如何支持新的文件格式？
A: 
1. 创建新的 Parser 类实现 `DocumentParser` 接口
2. 在 `src/lib/document/index.ts` 的 parsers 数组中注册
3. 更新 `getSupportedMimeTypes()` 函数

### Q: 本地开发时如何快速测试？
A: 
1. `npm run dev` 启动开发服务器
2. 准备测试文件（.md 或 .txt）
3. 在浏览器中测试上传和解析

### Q: 如何调试 TypeScript 错误？
A: 
```bash
npm run build  # 编译检查
```

## 下一步

参考 [PROJECT_STATUS.md](./PROJECT_STATUS.md) 了解项目进度和接下来的工作。

## 许可证

MIT

