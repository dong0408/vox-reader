# AI 文档语音阅读器技术设计文档

## 1. 项目名称

暂定：

**VoxReader**

一个可以将 PDF、Word、Markdown、TXT、图片等内容转换成自然语音的 AI 阅读应用。

核心能力：

文件 / 图片
→ 文本提取 / OCR
→ 内容清洗
→ 智能分段
→ TTS
→ 音频播放
→ 声音克隆

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
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Zustand
```

负责：

- 文件上传
- 文档阅读
- 音频播放器
- 阅读进度
- Voice 选择
- TTS 状态展示

---

## 后端

第一版：

```text
Next.js Route Handler
```

如果后期 OCR / PDF / 音频任务越来越重，再拆：

```text
Web
 ↓
Next.js API
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
                 │       Browser        │
                 │                      │
                 │ Document Reader      │
                 │ Audio Player         │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │       Next.js        │
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

# 6. 项目目录

建议：

```text
vox-reader/
│
├── app/
│   ├── page.tsx
│   │
│   ├── reader/
│   │   └── [documentId]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── documents/
│       │   ├── upload/
│       │   │   └── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       │
│       ├── tts/
│       │   └── route.ts
│       │
│       └── voices/
│           ├── route.ts
│           └── clone/
│               └── route.ts
│
├── components/
│   ├── uploader/
│   │   └── FileUploader.tsx
│   │
│   ├── reader/
│   │   ├── DocumentReader.tsx
│   │   ├── Paragraph.tsx
│   │   └── ReadingHighlight.tsx
│   │
│   └── player/
│       ├── AudioPlayer.tsx
│       ├── ProgressBar.tsx
│       └── VoiceSelector.tsx
│
├── lib/
│   ├── document/
│   │   ├── parser.ts
│   │   ├── markdown.ts
│   │   ├── docx.ts
│   │   ├── pdf.ts
│   │   └── image.ts
│   │
│   ├── ocr/
│   │   ├── index.ts
│   │   └── providers/
│   │
│   ├── tts/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── providers/
│   │       ├── elevenlabs.ts
│   │       └── mock.ts
│   │
│   ├── chunker/
│   │   └── textChunker.ts
│   │
│   └── storage/
│       └── index.ts
│
├── workers/
│   ├── document.worker.ts
│   └── tts.worker.ts
│
├── data/
│   ├── documents/
│   └── audio/
│
└── types/
    ├── document.ts
    └── audio.ts
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

播放器：

```ts
onSegmentPlay(segment) {
  setActiveBlockId(
    segment.blockId
  );
}
```

前端：

```tsx
<Paragraph
  active={
    block.id === activeBlockId
  }
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

# 33. MVP 技术选型

推荐第一版：

```text
Frontend
Next.js + React + Tailwind

Backend
Next.js Route Handler

Language
TypeScript

DOCX
Mammoth

Markdown
remark / unified

PDF
PDF.js 或独立 PDF Parser

OCR
Tesseract

TTS
TTSProvider 抽象
+
一个云 TTS Provider

Voice Clone
ElevenLabs（第二阶段）

Database
SQLite

ORM
Drizzle / Prisma

Audio
MP3

Storage
本地 data/

Queue
第一版不需要
```

---

# 34. 第一阶段开发顺序

严格按照这个顺序开发。

## Step 1

创建 Next.js 项目。

实现：

```text
首页
文件上传
```

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

播放器。

完成：

```text
Play
Pause
Next
Previous
Speed
```

---

## Step 8

实现：

```text
播放 → 当前段落高亮
```

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

---

## Step 12

加入：

```text
Reading Progress
```

---

## Step 13

最后加入：

```text
Voice Clone
```

---

# 35. Vibe Coding 规则

给 AI 编程工具以下规则：

```text
1. 使用 TypeScript strict mode。

2. 不允许在 React Component 中直接调用第三方 OCR/TTS API。

3. 所有 OCR 必须通过 OCRProvider。

4. 所有 TTS 必须通过 TTSProvider。

5. 所有文档解析器必须实现 DocumentParser。

6. API Key 只能存在服务端环境变量。

7. 上传文件必须检查 MIME type 和文件大小。

8. 所有异步任务必须有 loading / error / success 状态。

9. 一个文件只做一件事。

10. 不要过早引入微服务。

11. MVP 优先保证完整链路。

12. 不允许为了实现功能破坏已有接口。

13. 每完成一个模块必须增加测试。

14. 先写接口和数据结构，再写具体 Provider。

15. 第三方服务必须可以替换。
```

---

# 36. 环境变量

```env
DATABASE_URL=

TTS_PROVIDER=

ELEVENLABS_API_KEY=

MAX_UPLOAD_SIZE_MB=50

DATA_DIR=./data
```

不要：

```text
NEXT_PUBLIC_ELEVENLABS_API_KEY
```

否则 API Key 会进入浏览器。

---

# 37. 后期能力

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

# 38. 第一版验收标准

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

# 39. 第一条 Vibe Coding Prompt

把本技术文档放在项目根目录：

```text
docs/TECH_SPEC.md
```

然后给 Codex：

“阅读 docs/TECH_SPEC.md。

现在开始实现 VoxReader MVP。

第一阶段只实现：
1. Next.js + TypeScript 项目基础结构
2. 文件上传页面
3. DocumentParser 接口
4. MarkdownParser
5. TxtParser
6. NormalizedDocument 数据结构
7. 上传文件后解析并在 Reader 页面显示内容

暂时不要实现 PDF、DOCX、OCR、TTS、声音克隆和用户系统。

要求：
- TypeScript strict
- 使用清晰的模块边界
- Parser 必须可扩展
- 不允许将解析逻辑写在 React Component
- 每完成一个阶段运行 typecheck 和 lint
- 遇到错误先修复，不要绕过类型检查
- 完成后总结修改了哪些文件以及下一阶段应该做什么。”