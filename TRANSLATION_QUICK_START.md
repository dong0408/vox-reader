# 翻译功能 - 快速开始

## 🚀 快速5步配置

### 1. 复制环境变量文件
```bash
cp .env.local .env
```

### 2. 获取腾讯云密钥
- 登录 [腾讯云控制台](https://console.cloud.tencent.com)
- 开通 **机器翻译 (TMT)** 服务
- 获取 [API 密钥](https://console.cloud.tencent.com/cam/capi)

### 3. 填入环境变量
编辑 `.env` 文件：
```env
TENCENT_CLOUD_SECRET_ID=your_secret_id
TENCENT_CLOUD_SECRET_KEY=your_secret_key
```

### 4. 安装依赖
```bash
npm install
```

### 5. 启动服务
```bash
# 同时运行前端和后端
npm run dev:all
```

前端: http://localhost:5173
后端: http://localhost:3000

---

## 💡 使用方式

### 方式 1：在阅读器中使用
1. 打开任何文档
2. 选择 "翻译文本" 按钮
3. 选择源语言和目标语言
4. 点击 "翻译" 按钮

### 方式 2：在组件中使用

```vue
<TextTranslator 
  text="要翻译的文本"
  defaultSourceLanguage="auto"
  defaultTargetLanguage="en"
/>
```

### 方式 3：在脚本中使用

```typescript
import { useTranslation } from '@/composables/useTranslation'

const { translate } = useTranslation()
const result = await translate('你好', 'zh', 'en')
console.log(result) // "Hello"
```

---

## 📝 API 文档

### POST /api/translate - 翻译单文本
```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "sourceLanguage": "en",
    "targetLanguage": "zh"
  }'
```

**响应：**
```json
{
  "translatedText": "你好世界",
  "sourceLanguage": "en",
  "targetLanguage": "zh"
}
```

### POST /api/translate/batch - 批量翻译
```bash
curl -X POST http://localhost:3000/api/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "World"],
    "sourceLanguage": "en",
    "targetLanguage": "zh"
  }'
```

### GET /api/health - 健康检查
```bash
curl http://localhost:3000/api/health
```

---

## 🔐 安全提示

⚠️ **重要**: 绝不要将 `.env` 提交到 Git

```bash
# 确保 .env 被 .gitignore 忽略
echo ".env" >> .gitignore
git rm --cached .env
```

---

## 📋 支持的语言

- 自动检测 (auto)
- 中文简体 (zh) / 繁体 (zh-TW)
- 英文 (en)
- 日文 (ja)
- 韩文 (ko)
- 西班牙文 (es)
- 法文 (fr)
- 德文 (de)
- 俄文 (ru)
- 葡萄牙文 (pt)
- 土耳其文 (tr)
- 越南文 (vi)
- 泰文 (th)
- 阿拉伯文 (ar)
- ... 及更多

完整语言列表见 `TRANSLATION_SETUP.md`

---

## 🆘 故障排除

| 问题 | 解决方案 |
|------|--------|
| `Translation service is not configured` | 检查 `.env` 文件和环境变量 |
| 后端无法启动 | 运行 `npm install` 重新安装依赖 |
| 跨域错误 | 确保前端访问 `http://localhost:3000/api` |
| 翻译失败 | 检查网络和腾讯云服务状态 |
| API 额度超出 | 查看腾讯云成本管理界面，升级服务 |

---

## 📚 详细文档

完整的设置和使用指南，请参考 **[TRANSLATION_SETUP.md](./TRANSLATION_SETUP.md)**

---

**现在可以开始使用翻译功能了！** 🎉
