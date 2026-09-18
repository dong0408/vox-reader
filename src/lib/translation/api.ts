import type { TranslationRequest, TranslationResponse } from './types'

// 获取 API 基础 URL
function getAPIBaseUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 开发环境默认使用 localhost:3000
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api'
  }

  // 生产环境使用相对路径 /api（依赖 Nginx 或其他反向代理）
  return '/api'
}

const API_BASE_URL = getAPIBaseUrl()

// 打印 API 地址便于调试
if (typeof window !== 'undefined') {
  console.log('Translation API Base URL:', API_BASE_URL)
  console.log('Current URL:', window.location.href)
}

// 解析 JSON 错误处理
async function parseJSON(response: Response) {
  const text = await response.text()

  // 检查是否是 HTML（常见于错误页面）
  if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    throw new Error(
      `Expected JSON but received HTML. Status: ${response.status}. ` +
      `This might indicate the backend API is not running or the URL is incorrect. ` +
      `API URL was: ${response.url}`
    )
  }

  // 尝试解析 JSON
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(
      `Invalid JSON response from API. Status: ${response.status}. ` +
      `Response: ${text.substring(0, 200)}...`
    )
  }
}

export class TranslationAPI {
  static async translate(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const url = `${API_BASE_URL}/translate`
      console.log('🔄 Calling translation API:', url)
      console.log('📤 Request:', request)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Translation API error:', response.status, errorText)

        // 更详细的错误提示
        if (errorText.includes('<!') || errorText.includes('<html')) {
          throw new Error(
            `Backend API returned HTML (Status: ${response.status}). ` +
            `Please verify: 1) Backend is running on ${API_BASE_URL} ` +
            `2) Nginx/proxy is correctly configured 3) Check server logs`
          )
        }
        throw new Error(`Translation API error: ${response.statusText}. Details: ${errorText}`)
      }

      const data = await parseJSON(response)
      console.log('✅ Translation result:', data)
      return data
    } catch (error) {
      console.error('❌ Translation API call failed:', error)
      throw error
    }
  }

  static async batchTranslate(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string[]> {
    try {
      const url = `${API_BASE_URL}/translate/batch`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          sourceLanguage,
          targetLanguage,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Batch translation API error:', response.status, errorText)
        throw new Error(`Batch translation API error: ${response.statusText}. Details: ${errorText}`)
      }

      const data = await parseJSON(response)
      return data.translatedTexts
    } catch (error) {
      console.error('❌ Batch translation API call failed:', error)
      throw error
    }
  }
}
