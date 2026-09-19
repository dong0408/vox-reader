import type { TranslationRequest, TranslationResponse } from './types'

// 获取 API 基础 URL
function getAPIBaseUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL
    console.log('✓ Using VITE_API_BASE_URL:', url)
    return url
  }

  // 开发环境默认使用 localhost:3000
  if (import.meta.env.DEV) {
    console.log('✓ Development mode: using localhost:3000/api')
    return 'http://localhost:3000/api'
  }

  // 生产环境使用相对路径 /api
  // 依赖 EdgeOne 或其他反向代理将 /api/* 转发到后端
  console.log('✓ Production mode: using relative path /api')
  return '/api'
}

const API_BASE_URL = getAPIBaseUrl()

// 打印 API 地址便于调试
if (typeof window !== 'undefined') {
  console.log('🔧 Translation API configured:', {
    baseUrl: API_BASE_URL,
    currentUrl: window.location.href,
    mode: import.meta.env.DEV ? 'development' : 'production'
  })
}

// 解析 JSON 错误处理
async function parseJSON(response: Response) {
  const text = await response.text()

  // 检查是否是 HTML（常见于错误页面或路由配置错误）
  if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    throw new Error(
      `Expected JSON but received HTML. Status: ${response.status}. ` +
      `This indicates the API route is not properly configured. ` +
      `Check: 1) Is backend running? 2) Is EdgeOne route correct? 3) API URL: ${response.url}`
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
      console.log('📤 Translation request:', { url, text: request.text?.substring(0, 30) })

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error:', response.status, errorText?.substring(0, 200))

        if (errorText.includes('<!') || errorText.includes('<html')) {
          throw new Error(
            `Backend API returned HTML (Status: ${response.status}). ` +
            `Please verify: 1) Backend is deployed 2) EdgeOne routes are configured correctly`
          )
        }
        throw new Error(`Translation API error: ${response.statusText}. ${errorText?.substring(0, 100)}`)
      }

      const data = await parseJSON(response)
      console.log('✅ Translation success:', data.translatedText?.substring(0, 30))
      return data
    } catch (error) {
      console.error('❌ Translation failed:', error)
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
        console.error('❌ Batch translation error:', response.status, errorText?.substring(0, 200))
        throw new Error(`Batch translation API error: ${response.statusText}`)
      }

      const data = await parseJSON(response)
      return data.translatedTexts
    } catch (error) {
      console.error('❌ Batch translation failed:', error)
      throw error
    }
  }
}
