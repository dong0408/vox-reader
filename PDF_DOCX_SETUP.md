# PDF 和 DOCX 格式支持 - 安装指南

## 需要安装的库

为了支持 PDF 和 DOCX 格式，需要安装以下两个库：

### 1. PDF 支持 - `pdfjs-dist`
```bash
npm install pdfjs-dist
# 或使用 pnpm
pnpm add pdfjs-dist
```

**用途**: 解析 PDF 文件并提取文本内容

### 2. DOCX 支持 - `mammoth`
```bash
npm install mammoth
# 或使用 pnpm
pnpm add mammoth
```

**用途**: 解析 Word DOCX 文件并将其转换为纯文本

## 完整安装命令

```bash
pnpm add pdfjs-dist mammoth
```

## 已实现的功能

✅ **PDF 解析器** (`src/lib/document/pdf.ts`)
- 支持多页 PDF 文件
- 自动提取文本并按段落分割
- 记录每个文本块所在的页码

✅ **DOCX 解析器** (`src/lib/document/docx.ts`)
- 支持 Word 2007+ 格式 (.docx)
- 兼容旧 Office 格式 (.doc)
- 自动转换为纯文本段落

✅ **UI 更新** (`src/components/uploader/FileUploader.vue`)
- 支持拖放 PDF 和 DOCX 文件
- 更新了文件类型提示
- 前端验证支持的文件格式

✅ **类型定义更新** (`src/types/index.ts`)
- 已在 sourceType 中包含 'pdf' 和 'docx'

## 使用方式

安装库后，应用会自动支持：
- 上传 PDF 文件 (*.pdf)
- 上传 Word 文件 (*.doc, *.docx)
- 转换为文本段落进行语音合成

## 支持的格式总览

| 格式 | 扩展名 | 支持状态 |
|------|-------|--------|
| 文本文件 | .txt | ✅ 已支持 |
| Markdown | .md, .markdown | ✅ 已支持 |
| PDF | .pdf | ✅ 已支持* |
| Word 2007+ | .docx | ✅ 已支持* |
| Word 97-2003 | .doc | ✅ 已支持* |

*需要先安装依赖库

## 安装后的测试步骤

1. 安装依赖: `pnpm add pdfjs-dist mammoth`
2. 启动开发服务器: `pnpm dev`
3. 上传 PDF 或 DOCX 文件进行测试
4. 确认文本被正确提取和处理
