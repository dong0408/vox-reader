# AI 文档语音阅读器技术设计文档

## 1. 项目名称

**VoxReader**

一个可以将 PDF、Word、Markdown、TXT、图片等内容转换成自然语音的 AI 阅读应用。

核心能力：

```
文件 / 图片
→ 文本提取 / OCR
→ 内容清洗
→ 智能分段
→ TTS
→ 音频播放
→ 声音克隆
```

---

# 2. 产品目标

用户上传：

- PDF
- DOCX
- Markdown
- TXT
- PNG / JPG / WebP
- 扫描版 PDF

系统自动提取其中的文字，并通过 TTS 转换为自然语音。

用户可以：

- 播放 / 暂停
- 快进 / 后退
- 调整播放速度
- 从指定段落开始播放
- 点击文本跳转播放
- 查看当前正在朗读的文字
- 切换不同声音
- 使用自己的声音
- 克隆经授权的声音
- 保存阅读进度

最终体验类似：

```text
上传 PDF
    ↓
自动解析
    ↓
显示文章
    ↓
点击播放
    ↓
AI 开始朗读

第 1 章
██████████░░░░  03:21 / 12:43

「人工智能正在改变软件开发……」
             ↑
         当前朗读位置
```

---

# 3. MVP 范围

第一阶段不要一次实现所有功能。

## MVP 1

实现：

```text
上传文件
↓
提取文本
↓
文本展示
↓
分段
↓
调用 TTS
↓
生成 MP3
↓
网页播放器播放
```

支持：

```text
.md
.txt
.docx
.pdf（文本型）
.jpg
.png
```

暂时不做：

- 用户系统
- 云同步
- 支付
- 多设备同步
- 高级声音克隆
- AI Agent
- RAG

目标是：

**先跑通完整阅读链路。**

---

# 4. 技术栈

推荐 TypeScript 全栈。

## 前端

```text
Vite
Vue 3
TypeScript
UnoCSS
shadcn/vue
Pinia
VueUse
```

负责：

- 文件上传
- 文档阅读
- 音频播放器
- 阅读进度
- Voice 选择
- TTS 状态展示

### 技术选型说明

**Vite 作为构建工具**：
- 极快的开发体验
- 按需编译，HMR 秒级响应
- 生产打包体积小

**Vue 3 Composition API**：
- 更好的逻辑复用
- 更清晰的代码组织
- TypeScript 友好

**Pinia 状态管理**：
- Vue 官方推荐的状态库
- 比 Vuex 更简洁
- 完美支持 TypeScript
- 自动代码分割

**VueUse**：
- Vue 3 Composition API 的 Hooks 库
- 丰富的工具函数（useStorage、useFetch、useEventListener 等）
- 减少重复代码

**UnoCSS**：
- Tailwind CSS 的高性能替代品
- 更小的包体积
- 原子化 CSS，与 Tailwind 兼容
- 支持自定义规则

**shadcn/vue**：
- 组件库（基于 Radix UI）
- 完全可定制
- TypeScript 原生支持

---

## 后端

第一版：

```text
Node.js + Express / Fastify
TypeScript
```

或保持 Next.js API Routes：

```text
Next.js API Routes
```

如果后期 OCR / PDF / 音频任务越来越重，再拆：

```text
Web
 ↓
API Server
 ↓
Worker Service
```

Worker 可以使用：

```text
Node.js
或
Python
```

---

# 5. 系统架构

```text
                 ┌──────────────────────┐
                 │    Vue 3 SPA App     │
                 │                      │
                 │ Document Reader      │
                 │ Audio Player         │
                 │ File Upload          │
                 └──────────┬───────────┘
                            │
                     HTTP / WebSocket
                            │
                            ▼
                 ┌──────────────────────┐
                 │   API Server         │
                 │  (Express/Fastify    │
                 │   or Next.js API)    │
                 │                      │
                 │ Upload API           │
                 │ Document API         │
                 │ TTS API              │
                 │ Voice API            │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    Document Parser       OCR Engine       TTS Provider
          │                 │                 │
          ▼                 ▼                 ▼
    PDF / DOCX / MD      Image OCR        MP3 / Audio
          │
          ▼
    NormalizedDocument
          │
          ▼
       Chunker
          │
          ▼
    SpeechSegment[]
          │
          ▼
       TTS Queue
          │
          ▼
     AudioSegment[]
```

---

# 6. 项目目录结构

Vue 3 + Vite 项目推荐结构：

```text
vox-reader/
│
├── src/
│   ├── main.ts                 # 应用入口
│   ├── App.vue                 # 根组件
│   │
│   ├── pages/                  # 页面组件
│   │   ├── index.vue          # 首页
│   │   ├── reader.vue         # 阅读页面
│   │   └── notfound.vue       # 404
│   │
│   ├── components/             # 可复用组件
│   │   ├── uploader/
│   │   │   ├── FileUploader.vue
│   │   │   └── UploadProgress.vue
│   │   │
│   │   ├── reader/
│   │   │   ├── DocumentReader.vue
│   │   │   ├── Paragraph.vue
│   │   │   └── ReadingHighlight.vue
│   │   │
│   │   └── player/
│   │       ├── AudioPlayer.vue
│   │       ├── ProgressBar.vue
│   │       └── VoiceSelector.vue
│   │
│   ├── stores/                 # Pinia 状态管理
│   │   ├── index.ts           # 导出所有 store
│   │   ├── document.ts        # 文档状态
│   │   ├── player.ts          # 播放器状态
│   │   ├── voice.ts           # 声音状态
│   │   └── progress.ts        # 阅读进度状态
│   │
│   ├── composables/            # 组合式函数 (VueUse + 自定义)
│   │   ├── useDocument.ts     # 文档相关逻辑
│   │   ├── usePlayer.ts       # 播放器逻辑
│   │   ├── useTTS.ts          # TTS 相关
│   │   ├── useOCR.ts          # OCR 相关
│   │   └── useStorage.ts      # 本地存储封装
│   │
│   ├── services/               # API 服务层
│   │   ├── api.ts             # API 基础配置
│   │   ├── document.ts        # 文档 API
│   │   ├── tts.ts             # TTS API
│   │   ├── voice.ts           # Voice API
│   │   └── upload.ts          # 上传 API
│   │
│   ├── lib/                    # 共享工具库
│   │   ├── document/
│   │   │   ├── parser.ts
│   │   │   ├── markdown.ts
│   │   │   ├── docx.ts
│   │   │   ├── pdf.ts
│   │   │   └── image.ts
│   │   │
│   │   ├── ocr/
│   │   │   ├── index.ts
│   │   │   └── providers/
│   │   │
│   │   ├── tts/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── providers/
│   │   │       ├── elevenlabs.ts
│   │   │       └── mock.ts
│   │   │
│   │   ├── chunker/
│   │   │   └── textChunker.ts
│   │   │
│   │   ├── storage/
│   │   │   └── index.ts
│   │   │
│   │   └── utils/
│   │       ├── format.ts
│   │       └── validate.ts
│   │
│   ├── types/                  # TypeScript 类型定义
│   │   ├── document.ts
│   │   ├── audio.ts
│   │   ├── api.ts
│   │   └── index.ts
│   │
│   ├── assets/                 # 静态资源
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── styles/                 # 全局样式
│   │   └── main.css           # UnoCSS 配置通常在 uno.config.ts
│   │
│   └── router/                 # 路由（如需要）
│       ├── index.ts
│       └── routes.ts
│
├── server/                      # 后端代码（如果分离）
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── lib/
│   │   └── types/
│   │
│   └── package.json
│
├── data/                        # 本地数据存储
│   ├── documents/
│   └── audio/
│
├── public/                      # 静态文件
│
├── vite.config.ts             # Vite 配置
├── vitest.config.ts           # 测试配置（可选）
├── tsconfig.json              # TypeScript 配置
├── uno.config.ts              # UnoCSS 配置
├── .env.example               # 环境变量示例
├── package.json
└── README.md
```

---

# 7. 核心数据结构

不要让不同 Parser 返回不同格式。

所有文档最终转换成统一结构：

```ts
export interface NormalizedDocument {
  id: string;

  title: string;

  sourceType:
    | "pdf"
    | "docx"
    | "markdown"
    | "txt"
    | "image";

  blocks: DocumentBlock[];

  createdAt: string;
}
```

Block：

```ts
export interface DocumentBlock {
  id: string;

  type:
    | "heading"
    | "paragraph"
    | "list"
    | "quote"
    | "code";

  text: string;

  level?: number;

  page?: number;
}
```

例如：

```json
{
  "id": "doc_123",
  "title": "人工智能简介",
  "sourceType": "pdf",
  "blocks": [
    {
      "id": "block_1",
      "type": "heading",
      "text": "第一章 人工智能"
    },
    {
      "id": "block_2",
      "type": "paragraph",
      "text": "人工智能正在改变软件开发。"
    }
  ]
}
```

---

# 8. 文档解析

统一入口：

```ts
export interface DocumentParser {
  supports(mimeType: string): boolean;

  parse(
    file: Buffer,
    metadata: FileMetadata,
  ): Promise<NormalizedDocument>;
}
```

主 Parser：

```ts
async function parseDocument(
  file: Buffer,
  mimeType: string,
) {
  const parser = parsers.find(
    parser => parser.supports(mimeType)
  );

  if (!parser) {
    throw new Error(
      `Unsupported file type: ${mimeType}`
    );
  }

  return parser.parse(file, {
    mimeType,
  });
}
```

这样以后增加：

```text
EPUB
HTML
PPTX
网页 URL
微信公众号文章
```

都不需要修改主流程。

---

# 9. Markdown

Markdown 不需要 OCR。

直接：

```text
Markdown
 ↓
Markdown Parser
 ↓
AST
 ↓
DocumentBlock[]
```

建议保留：

```text
heading
paragraph
list
quote
code
```

但是默认：

```text
code block
```

不要朗读。

例如：

```md
# React

React 是一个 UI Library。

```ts
const a = 1;
```
```

TTS 默认只读：

```text
React。

React 是一个 UI Library。
```

---

# 10. Word DOCX

DOCX 推荐使用：

```text
mammoth
```

最简单：

```ts
import mammoth from "mammoth";

const result =
  await mammoth.extractRawText({
    buffer,
  });

const text = result.value;
```

更好的方案：

```text
DOCX
 ↓
Mammoth HTML
 ↓
HTML Parser
 ↓
NormalizedDocument
```

这样可以保留：

```text
Heading 1
Heading 2
Paragraph
List
```

而不是全部变成纯文本。

---

# 11. PDF

PDF 是整个项目最麻烦的部分。

必须区分：

```text
PDF
├── Text PDF
└── Scanned PDF
```

## Text PDF

例如：

```text
Word → Export PDF
网页 → Print PDF
```

PDF 内本身有文字。

流程：

```text
PDF
 ↓
PDF Parser
 ↓
Text Layer
 ↓
DocumentBlock[]
```

不应该 OCR。

---

## Scanned PDF

例如：

```text
书籍扫描件
合同扫描件
照片生成 PDF
```

没有有效 Text Layer。

流程：

```text
PDF
 ↓
检测 Text Layer
 ↓
没有文本
 ↓
PDF Page
 ↓
Render Image
 ↓
OCR
 ↓
Text
```

---

# 12. PDF 自动判断

实现：

```ts
async function parsePdf(file: Buffer) {
  const text = await extractPdfText(file);

  if (isValidText(text)) {
    return parseTextPdf(text);
  }

  return parseScannedPdf(file);
}
```

例如：

```ts
function isValidText(text: string) {
  const cleaned = text.trim();

  if (cleaned.length < 100) {
    return false;
  }

  return true;
}
```

生产环境可以进一步判断：

```text
字符数量
可打印字符比例
乱码比例
页面文本密度
```

---

# 13. OCR

OCR 设计成 Provider。

```ts
export interface OCRProvider {
  recognize(
    image: Buffer,
  ): Promise<OCRResult>;
}
```

返回：

```ts
export interface OCRResult {
  text: string;

  confidence?: number;

  blocks?: OCRBlock[];
}
```

MVP 可以使用：

```text
Tesseract
```

之后可替换：

```text
PaddleOCR
云 OCR
Vision Model
```

不要把 OCR 逻辑直接写死在 PDF Parser 里面。

---

# 14. 文本清洗

提取出来的文字不能直接送 TTS。

需要：

```text
Raw Text
 ↓
Normalizer
 ↓
Readable Text
```

例如 PDF：

```text
人工智能是一门研究人类智
能行为的科学。它涉及机器学
习、自然语言处理等领域。
```

需要尽可能恢复成：

```text
人工智能是一门研究人类智能行为的科学。
它涉及机器学习、自然语言处理等领域。
```

Normalizer 负责：

```text
去页眉
去页脚
去页码
合并错误换行
去重复空格
修复 OCR 空格
处理特殊符号
过滤 URL
过滤代码
处理 Markdown 标记
```

---

# 15. TTS 前文本转换

可以额外增加：

```ts
interface SpeechNormalizer {
  normalize(text: string): Promise<string>;
}
```

例如：

```text
CPU → C P U
2026-09-16 → 2026年9月16日
3.14 → 三点一四
https://... → 跳过
```

第一版规则处理。

以后可以加入 LLM：

```text
Document Text
 ↓
LLM Speech Normalizer
 ↓
适合朗读的文本
```

但是：

**不要让 LLM 修改原文含义。**

---

# 16. Chunk 分段

这是项目非常重要的一层。

不要：

```text
整本 PDF
 ↓
一次 TTS
```

应该：

```text
Document
 ↓
Paragraph
 ↓
Speech Chunk
 ↓
TTS
```

数据：

```ts
export interface SpeechSegment {
  id: string;

  documentId: string;

  blockId: string;

  index: number;

  text: string;

  audioUrl?: string;

  duration?: number;

  status:
    | "pending"
    | "generating"
    | "ready"
    | "failed";
}
```

建议每个 Segment：

```text
100 ～ 500 中文字符
```

优先按照：

```text
段落
。
！
？
；
```

进行切分。

不要简单：

```ts
text.slice(0, 500)
```

否则可能把一句话从中间切开。

---

# 17. TTS Provider

这一层必须抽象。

```ts
export interface TTSProvider {
  synthesize(
    request: TTSRequest,
  ): Promise<TTSResult>;
}
```

Request：

```ts
export interface TTSRequest {
  text: string;

  voiceId: string;

  speed?: number;

  format?: "mp3" | "wav";
}
```

Result：

```ts
export interface TTSResult {
  audio: Buffer;

  format: string;

  duration?: number;
}
```

这样：

```text
Application
      │
      ▼
 TTSProvider
      │
 ┌────┼─────────┐
 ▼    ▼         ▼
OpenAI ElevenLabs Local
```

业务代码永远不要直接依赖某一个 TTS 厂商。

---

# 18. TTS 工作流

用户点击：

```text
播放
```

不要等整篇文章生成完成。

采用：

```text
Chunk 1 → TTS → 播放
Chunk 2 → TTS → 缓存
Chunk 3 → TTS → 缓存
Chunk 4 → 等待
```

例如：

```text
当前播放：

Chunk 12

后台：

Chunk 13 → ready
Chunk 14 → generating
Chunk 15 → pending
```

这样首播延迟会低很多。

---

# 19. Audio Cache

相同：

```text
text
voice
speed
model
```

不应该重复生成。

计算：

```ts
const cacheKey = sha256(
  JSON.stringify({
    text,
    voiceId,
    speed,
    model,
  })
);
```

缓存：

```text
data/audio/

abc123.mp3
def456.mp3
ghi789.mp3
```

以后生产环境：

```text
S3
R2
OSS
COS
```

---

# 20. 播放器

播放器至少支持：

```text
播放
暂停
上一段
下一段
进度
倍速
音量
声音选择
```

UI：

```text
────────────────────────────

人工智能正在改变我们的生活。

它已经被应用于医疗、教育、
软件开发和科学研究。

────────────────────────────

          03:21 / 21:43

      ◀ 10s   ▶   10s ▶

       0.8  1.0  1.2  1.5

Voice:
[ 我的声音 ▼ ]

────────────────────────────
```

---

# 21. 文字和声音同步

每个：

```text
SpeechSegment
```

对应：

```text
DocumentBlock
```

例如：

```ts
{
  segmentId: "segment_23",
  blockId: "paragraph_12"
}
```

Vue 3 中的播放器实现：

```ts
// 使用 ref 和 computed 管理状态
const activeBlockId = ref<string>("");

const handleSegmentPlay = (segment: SpeechSegment) => {
  activeBlockId.value = segment.blockId;
};
```

模板中：

```vue
<Paragraph
  :active="block.id === activeBlockId"
/>
```

即可实现：

```text
朗读到哪
↓
高亮到哪
```

MVP 先做到**段落级同步**。

第二阶段再做：

```text
句子级
```

第三阶段：

```text
词级时间戳
```

---

# 22. 阅读进度

保存：

```ts
interface ReadingProgress {
  documentId: string;

  segmentIndex: number;

  audioTime: number;

  updatedAt: string;
}
```

使用 VueUse 的 `useStorage` 进行本地存储：

```ts
import { useStorage } from '@vueuse/core'

const readingProgress = useStorage(
  'reading_progress',
  {} as Record<string, ReadingProgress>
)
```

用户关闭网页：

```text
第 35 段
01:32
```

下次打开：

```text
继续上次阅读？
```

---

# 23. Voice 系统

定义：

```ts
interface Voice {
  id: string;

  name: string;

  provider: string;

  type:
    | "system"
    | "cloned";

  language?: string;
}
```

例如：

```json
{
  "id": "voice_123",
  "name": "我的声音",
  "provider": "elevenlabs",
  "type": "cloned",
  "language": "zh"
}
```

---

# 24. 声音克隆

声音克隆作为第二阶段功能。

流程：

```text
用户
 ↓
录制 / 上传语音
 ↓
确认声音授权
 ↓
Voice Clone Provider
 ↓
voiceId
 ↓
保存 Voice
 ↓
TTS 使用 voiceId
```

API：

```text
POST /api/voices/clone
```

Request：

```text
multipart/form-data

name
audio[]
consent=true
```

Response：

```json
{
  "voiceId": "voice_xxx",
  "name": "My Voice"
}
```

重要：

**只允许用户克隆自己或明确获得授权的声音。**

产品必须要求用户确认：

```text
☑ 我确认拥有该声音，或已经获得声音所有者授权。
```

如果后续公开运营，应进一步增加：

```text
授权记录
滥用举报
Voice 删除
生成记录
敏感操作审计
```

---

# 25. 数据库

MVP：

```text
SQLite
+
Prisma / Drizzle
```

后期：

```text
PostgreSQL
```

主要表：

```text
documents
document_blocks
speech_segments
voices
reading_progress
```

---

# 26. Document

```ts
Document {
  id
  title
  sourceType
  filePath
  status
  createdAt
}
```

状态：

```text
uploaded
parsing
ocr
ready
failed
```

---

# 27. SpeechSegment

```text
id
documentId
blockId
index
text
audioUrl
duration
voiceId
status
createdAt
```

---

# 28. Voice

```text
id
name
provider
providerVoiceId
type
createdAt
```

注意：

```text
providerVoiceId
```

不要直接暴露到前端业务逻辑。

---

# 29. API 设计

## 上传文档

```text
POST /api/documents/upload
```

Response：

```json
{
  "documentId": "doc_123",
  "status": "parsing"
}
```

---

## 查询文档

```text
GET /api/documents/:id
```

---

## 查询解析状态

```text
GET /api/documents/:id/status
```

Response：

```json
{
  "status": "ready",
  "progress": 100
}
```

---

## 生成语音

```text
POST /api/tts
```

Request：

```json
{
  "segmentId": "segment_123",
  "voiceId": "voice_123",
  "speed": 1
}
```

---

## Voice List

```text
GET /api/voices
```

---

## Clone Voice

```text
POST /api/voices/clone
```

---

# 30. 长文档任务队列

后期不要在 HTTP Request 中完成：

```text
300 页 PDF
↓
OCR
↓
TTS
```

应该：

```text
Upload API
 ↓
创建 Job
 ↓
立即返回 documentId
 ↓
Queue
 ↓
Worker
 ↓
OCR / Parse
 ↓
Database
```

可以使用：

```text
Redis
+
BullMQ
```

任务：

```text
parse-document
ocr-page
normalize-document
generate-speech
```

---

# 31. 状态机

Document：

```text
UPLOADED
   ↓
PARSING
   ↓
OCR_REQUIRED
   ↓
OCR_PROCESSING
   ↓
NORMALIZING
   ↓
READY
```

异常：

```text
任何状态
   ↓
FAILED
```

---

# 32. TTS 状态机

```text
PENDING
   ↓
GENERATING
   ↓
READY
```

失败：

```text
GENERATING
   ↓
FAILED
   ↓
RETRY
```

---

# 33. Pinia Store 架构

使用 Pinia 进行状态管理，充分利用 TypeScript 和 Vue 3 的优势。

## Store 设计原则

1. **单一职责**：每个 Store 只管理一个业务域
2. **类型安全**：充分使用 TypeScript 类型
3. **计算属性**：使用 computed 替代 getter
4. **异步操作**：在 actions 中处理 API 调用

## Document Store

```ts
// src/stores/document.ts
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

  return {
    currentDocument,
    documents,
    loading,
    error,
    hasDocument,
    setDocument,
    addDocument,
  }
})
```

## Player Store

```ts
// src/stores/player.ts
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
    return duration.value ? (currentTime / duration.value) * 100 : 0
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
  }
})
```

---

# 34. Vue 3 Composables 架构

使用 VueUse 和自定义 Composables 实现逻辑复用。

## useDocument Composable

```ts
// src/composables/useDocument.ts
import { ref, computed } from 'vue'
import { useDocumentStore } from '@/stores'
import * as documentService from '@/services/document'
import type { NormalizedDocument } from '@/types'

export function useDocument() {
  const store = useDocumentStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDocument = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const doc = await documentService.getDocument(id)
      store.setDocument(doc)
      return doc
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadDocument = async (file: File) => {
    loading.value = true
    error.value = null
    try {
      const doc = await documentService.uploadDocument(file)
      store.addDocument(doc)
      return doc
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchDocument,
    uploadDocument,
  }
}
```

## usePlayer Composable

```ts
// src/composables/usePlayer.ts
import { ref, watch } from 'vue'
import { usePlayerStore } from '@/stores'
import { useStorage } from '@vueuse/core'

export function usePlayer() {
  const store = usePlayerStore()
  const audioElement = ref<HTMLAudioElement | null>(null)

  // 使用 VueUse 的 useStorage 持久化播放状态
  const playlistState = useStorage('player_state', {
    documentId: '',
    segmentIndex: 0,
    currentTime: 0,
  })

  const play = async () => {
    audioElement.value?.play()
    store.play()
  }

  const pause = () => {
    audioElement.value?.pause()
    store.pause()
  }

  const seek = (time: number) => {
    if (audioElement.value) {
      audioElement.value.currentTime = time
      store.currentTime = time
    }
  }

  watch(
    () => store.playbackRate,
    (rate) => {
      if (audioElement.value) {
        audioElement.value.playbackRate = rate
      }
    }
  )

  return {
    audioElement,
    play,
    pause,
    seek,
    playlistState,
  }
}
```

---

# 35. UnoCSS 配置

UnoCSS 是 Tailwind CSS 的高性能替代品。

```ts
// uno.config.ts
import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  shortcuts: {
    // 常用组件快捷方式
    'btn-primary': 'px-4 py-2 rounded bg-primary text-white hover:bg-opacity-90 transition',
    'btn-secondary': 'px-4 py-2 rounded bg-secondary text-white hover:bg-opacity-90 transition',
    'card': 'rounded-lg border border-gray-200 p-4 shadow-sm',
  },
})
```

在 Vue 组件中使用：

```vue
<template>
  <div class="card">
    <button class="btn-primary">Primary Button</button>
  </div>
</template>
```

---

# 36. Vue 3 + TypeScript 最佳实践

### 1. 组件定义

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'

interface Props {
  title: string
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 0,
})

const emit = defineEmits<{
  submit: [value: string]
}>()

const internalCount = ref(0)
const doubled = computed(() => internalCount.value * 2)
</script>

<template>
  <div class="component">
    {{ title }}
  </div>
</template>
```

### 2. 组件通信

使用 Props、Emits 和 Provide/Inject：

```ts
// 父组件
<template>
  <Child
    :message="msg"
    @update="handleUpdate"
  />
</template>

// 子组件
<script setup lang="ts">
defineProps<{ message: string }>()
const emit = defineEmits<{ update: [value: string] }>()
</script>
```

### 3. 响应式状态

```ts
// ✅ 推荐：使用 ref
const count = ref(0)

// ✅ 推荐：使用 reactive（仅限对象）
const state = reactive({
  count: 0,
  name: 'Vue'
})

// ❌ 避免：在组件外混合使用
```

---

# 37. 环境变量

```env
# API
VITE_API_BASE_URL=http://localhost:3000/api

# TTS 服务
VITE_TTS_PROVIDER=elevenlabs

# 文件上传限制
VITE_MAX_UPLOAD_SIZE_MB=50

# 存储路径
VITE_DATA_DIR=./data

# 可选：第三方服务 Key（不要前缀 VITE_，保持在服务端）
# 服务端环境变量
ELEVENLABS_API_KEY=

DATABASE_URL=
```

**重要**：不要在 VITE_* 前缀中暴露 API Key！

---

# 38. 后期能力

MVP 完成后可以加入：

```text
EPUB
网页 URL
RSS
PPT
微信文章
字幕 SRT
```

以及：

```text
AI 摘要
AI 章节总结
AI 解释
AI 翻译
```

例如：

```text
PDF
 ↓
原文
 ├────────→ TTS → 中文朗读
 │
 ├────────→ Translate → 英文 → TTS
 │
 ├────────→ Summary → 摘要 → TTS
 │
 └────────→ Explain → 通俗解释 → TTS
```

最终可以变成：

**AI Audio Reader / AI 有声阅读平台。**

---

# 39. 第一版验收标准

MVP 完成的定义：

用户可以上传：

```text
Markdown
TXT
DOCX
PDF
图片
```

系统能够：

```text
上传
 ↓
解析/OCR
 ↓
显示文字
 ↓
分段
 ↓
生成语音
 ↓
连续播放
 ↓
高亮当前段落
 ↓
记录阅读进度
```

并且：

```text
刷新页面
↓
仍然能够继续阅读
```

做到这里以后，再开发 Voice Clone。

---

# 40. Vue 3 项目初始化命令

### 快速开始

```bash
# 使用 create-vite
npm create vite@latest vox-reader -- --template vue-ts

cd vox-reader

# 安装依赖
npm install

# 安装额外依赖
npm install pinia @vueuse/core unocss @unocss/reset
npm install -D unocss @unocss/preset-uno @unocss/preset-attributify

# 开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 项目结构初始化

```bash
# 创建所需的目录
mkdir -p src/{pages,components,stores,composables,services,lib,types,assets,styles,router}
mkdir -p public data
```

---

# 41. Vibe Coding 规则

给 AI 编程工具以下规则：

```text
1. 使用 TypeScript strict mode。

2. 优先使用 Vue 3 <script setup> 语法。

3. 状态管理必须使用 Pinia，不要混用其他方案。

4. 所有异步逻辑必须在 composables 或 actions 中，不在组件中。

5. 组件逻辑复用必须使用 composables，不要直接复制代码。

6. API 请求必须通过 services 层，不要在组件中直接调用。

7. 所有 OCR 必须通过 OCRProvider 接口。

8. 所有 TTS 必须通过 TTSProvider 接口。

9. 所有文档解析器必须实现 DocumentParser 接口。

10. API Key 只能存在服务端环境变量。

11. 上传文件必须检查 MIME type 和文件大小。

12. 使用 UnoCSS 的原子化类或 shortcuts，避免写原始 CSS。

13. 使用 VueUse 的工具函数（useStorage、useFetch 等）。

14. 一个文件只做一件事，保持单一职责。

15. 不要过早引入微服务。

16. MVP 优先保证完整链路。

17. 不允许为了实现功能破坏已有接口。

18. 每完成一个模块必须增加单元测试。

19. 先写接口和数据结构，再写具体实现。

20. 第三方服务必须可以替换。

21. 所有事件监听器必须在 onMounted 中注册，onUnmounted 中清理。

22. 使用 computed 而不是 methods 处理派生状态。

23. Props 和 Emits 必须有完整的 TypeScript 类型。

24. 避免在模板中执行复杂逻辑，提取到 computed 或 methods。
```

---

# 42. 第一阶段开发顺序

严格按照这个顺序开发。

## Step 1

创建 Vue 3 + Vite + TypeScript 项目。

实现：

```text
首页
文件上传
```

确保：
- 项目结构正确
- TypeScript 严格模式开启
- UnoCSS 配置完成
- 能上传文件

---

## Step 2

实现：

```ts
DocumentParser
```

先只支持：

```text
.txt
.md
```

确认：

```text
上传 → 提取 → 网页显示
```

完全正常。

使用 Pinia 存储文档状态。

---

## Step 3

加入 DOCX。

```text
DOCX
↓
Mammoth
↓
DocumentBlock[]
```

---

## Step 4

加入 Text PDF。

暂时不要 OCR。

---

## Step 5

实现：

```ts
TextChunker
```

将：

```text
DocumentBlock[]
```

转换：

```text
SpeechSegment[]
```

---

## Step 6

实现：

```ts
TTSProvider
```

先做：

```text
MockTTSProvider
```

再接真正 TTS API。

---

## Step 7

播放器组件。

完成：

```text
Play
Pause
Next
Previous
Speed
```

使用 composable 管理播放状态。

---

## Step 8

实现：

```text
播放 → 当前段落高亮
```

同步文字和语音。

---

## Step 9

加入：

```text
Image
↓
OCR
↓
Document
```

---

## Step 10

加入扫描 PDF：

```text
PDF
↓
检测文字
↓
没有文字
↓
页面转图片
↓
OCR
```

---

## Step 11

加入：

```text
Audio Cache
```

使用 IndexedDB 或本地文件存储。

---

## Step 12

加入：

```text
Reading Progress
```

使用 VueUse 的 useStorage。

---

## Step 13

最后加入：

```text
Voice Clone
```

---

# 43. 第一条 Vibe Coding Prompt

把本技术文档放在项目根目录：

```text
docs/TECH_SPEC.md
```

然后给 Claude Code：

```
阅读 docs/TECH_SPEC.md。

现在开始实现 VoxReader MVP。

第一阶段只实现：
1. Vue 3 + TypeScript 项目基础结构
2. Vite + UnoCSS 配置
3. Pinia Store 基础设置
4. 文件上传页面
5. DocumentParser 接口
6. MarkdownParser
7. TxtParser
8. NormalizedDocument 数据结构
9. 上传文件后解析并在 Reader 页面显示内容

暂时不要实现 PDF、DOCX、OCR、TTS、声音克隆和用户系统。

要求：
- TypeScript strict mode
- 使用 <script setup> 语法
- 使用 Pinia 管理状态
- 使用 composables 复用逻辑
- 使用 UnoCSS 样式
- 所有 Parser 必须实现 DocumentParser 接口
- 不允许将解析逻辑写在 Vue Component 中
- API Key 必须在服务端环境变量
- 每完成一个阶段运行 typecheck
- 遇到错误先修复，不要绕过类型检查
- 完成后总结修改了哪些文件以及下一阶段应该做什么。
```

---

# 44. 技术选型总结

| 技术栈 | 原方案 | 新方案 | 优势 |
|--------|--------|--------|------|
| 构建工具 | Next.js | Vite | 极快的 HMR，更轻量 |
| 框架 | React | Vue 3 | 学习曲线更平缓，官方方案丰富 |
| 状态管理 | Zustand | Pinia | 更好的 TypeScript 支持，官方推荐 |
| 样式 | Tailwind CSS | UnoCSS | 更小的体积，兼容 Tailwind 类 |
| Hooks 库 | React Hooks | VueUse | 丰富的组合式函数，减少代码量 |
| UI 组件库 | shadcn/ui | shadcn/vue | 完整的 Vue 3 支持 |
| 后端 | Next.js Route Handler | Express/Fastify 或 Next.js API | 灵活性更高 |

---

# 45. 常见问题

### Q: 为什么选择 Vue 3 而不是 React？

A: Vue 3 的 Composition API 更符合函数式编程思想，VueUse 提供的工具函数更开箱即用。Pinia 比 Redux/Zustand 更简洁，TypeScript 类型支持更好。对于中小型项目，Vue 生态更加完整。

### Q: UnoCSS 和 Tailwind CSS 有什么区别？

A: UnoCSS 是 Tailwind CSS 的高性能替代品。它提供相同的类名约定，但编译速度更快，生成的 CSS 更小。支持自定义规则，可以完全兼容 Tailwind 的类名。

### Q: 为什么分离 services 层？

A: 这样做可以：
1. 避免在组件中直接调用 API
2. 便于单元测试
3. 便于 API 逻辑复用
4. 便于切换 API 实现

### Q: Pinia 如何替代 Redux/Zustand？

A: Pinia 的 API 更简洁，支持组合式语法和选项式语法。不需要手动定义 actions，自动支持代码分割，TypeScript 类型推导更完美。

### Q: VueUse 提供了哪些工具？

A: VueUse 提供 100+ 的组合式函数：
- useStorage / useLocalStorage / useSessionStorage
- useFetch
- useEventListener
- useMouse
- useWindowSize
- 等等

### Q: 如何测试 Vue 3 组件？

A: 推荐使用 Vitest + Vue Test Utils：
```bash
npm install -D vitest @vue/test-utils happy-dom
```

然后编写测试：
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('renders', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.exists()).toBe(true)
  })
})
```

---

**文档最后更新时间**：2026-09-17

**推荐阅读顺序**：1 → 2 → 3 → 4 → 5 → 6 → 7 → 33 → 34 → 35 → 36 → 40 → 41 → 42 → 43
