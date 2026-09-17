import type { DocumentBlock, SpeechSegment } from '@/types'

export interface ChunkerOptions {
  minChunkSize?: number
  maxChunkSize?: number
}

const DEFAULT_MAX_SIZE = 800

export function chunkDocument(
  documentId: string,
  blocks: DocumentBlock[],
  options: ChunkerOptions = {},
): SpeechSegment[] {
  const maxSize = options.maxChunkSize ?? DEFAULT_MAX_SIZE

  const segments: SpeechSegment[] = []
  let segmentIndex = 0

  // 首先按原始块（通常是段落）分组
  const blockGroups: DocumentBlock[][] = []
  let currentGroup: DocumentBlock[] = []

  for (const block of blocks) {
    // 跳过代码块
    if (block.type === 'code') {
      continue
    }

    const blockText = block.text.trim()
    if (!blockText) {
      // 空行表示段落分割
      if (currentGroup.length > 0) {
        blockGroups.push(currentGroup)
        currentGroup = []
      }
      continue
    }

    currentGroup.push(block)
  }

  // 不要忘记最后一组
  if (currentGroup.length > 0) {
    blockGroups.push(currentGroup)
  }

  // 对每个块组进行处理
  for (const group of blockGroups) {
    let groupText = ''
    let blockIds: string[] = []

    for (const block of group) {
      const blockText = block.text.trim()
      if (!blockText) continue

      if (!blockIds.includes(block.id)) {
        blockIds.push(block.id)
      }

      groupText += (groupText ? ' ' : '') + blockText
    }

    if (!groupText.trim()) continue

    // 将段落文本按句子分割
    const sentences = splitBySentence(groupText)

    let currentChunk = ''
    let chunkBlockIds = blockIds.slice(0, 1) // 使用第一个块ID

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      // 检查是否添加这个句子会超过最大长度
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence

      if (potentialChunk.length > maxSize && currentChunk) {
        // 保存当前分段
        const chunk = currentChunk.trim()
        if (chunk.length > 0) {
          segments.push({
            id: `segment_${segmentIndex}`,
            documentId,
            blockId: chunkBlockIds[0],
            index: segmentIndex,
            text: chunk,
            status: 'pending',
          })
          segmentIndex++
        }
        currentChunk = trimmedSentence
      } else {
        currentChunk = potentialChunk
      }
    }

    // 保存剩余的文本（即使很小也要保存）
    if (currentChunk.trim()) {
      segments.push({
        id: `segment_${segmentIndex}`,
        documentId,
        blockId: chunkBlockIds[0],
        index: segmentIndex,
        text: currentChunk.trim(),
        status: 'pending',
      })
      segmentIndex++
    }
  }

  return segments
}

/**
 * 按照句子分割文本
 * 支持中文句号、感叹号、问号等
 */
function splitBySentence(text: string): string[] {
  if (!text) return []

  // 使用正则表达式按照各种句号分割
  // 保留句号在结果中
  const sentences = text.match(/[^。！？；，\n]+[。！？；，]?/g) || []

  // 过滤空字符串并返回
  return sentences.filter((s) => s.trim().length > 0)
}
