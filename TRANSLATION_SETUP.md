# 腾讯云机器翻译集成指南

## 📋 功能概述

本项目已集成腾讯云机器翻译 (TMT) 服务，支持以下功能：
- 单文本翻译
- 批量翻译
- 自动语言检测
- 翻译缓存
- 支持 18+ 种语言

## 🔑 获取腾讯云密钥

### 步骤 1：创建腾讯云账户
访问 [腾讯云官网](https://cloud.tencent.com) 并创建账户

### 步骤 2：开通机器翻译服务
1. 登录腾讯云控制台
2. 搜索 "机器翻译" (TMT)
3. 点击 "立即开通"
4. 选择合适的计费方式（推荐先用免费额度）

### 步骤 3：获取 API 密钥
1. 进入 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 点击 "新建密钥"
3. 复制 `SecretId` 和 `SecretKey`
4. **妥善保管** - 不要提交到 Git

## ⚙️ 环境配置

### 1. 复制环境变量文件
```bash
cp .env.local .env
# 或 for Windows
copy .env.local .env
```

### 2. 填入腾讯云凭证
编辑 `.env` 文件：
```env
TENCENT_CLOUD_SECRET_ID=your_secret_id_here
TENCENT_CLOUD_SECRET_KEY=your_secret_key_here
TENCENT_CLOUD_REGION=ap-beijing
TENCENT_CLOUD_PROJECT_ID=0
```

### 3. 在 .gitignore 中确保 .env 被忽略
```
.env
.env.local
```

## 🚀 运行项目

### 安装依赖
```bash
npm install
```

### 同时运行前端和后端
```bash
npm run dev:all
```

或分别运行：
```bash
# 终端 1：前端（Vite Dev Server）
npm run dev

# 终端 2：后端（Express Server）
npm run dev:server
```

前端访问：http://localhost:5173
后端 API：http://localhost:3000/api

## 📝 使用方式

### 前端集成翻译组件

在需要翻译的页面中使用 `TextTranslator` 组件：

```vue
<script setup lang="ts">
import TextTranslator from '@/components/translator/TextTranslator.vue'
import { ref } from 'vue'

const currentSegment = ref('这是一段需要翻译的文本')
</script>

<template>
  <TextTranslator 
    :text="currentSegment.text" 
    defaultSourceLanguage="auto"
    defaultTargetLanguage="en"
    @translated="(text) => console.log('翻译结果:', text)"
  />
</template>
```

### 在 Composable 中使用翻译

```typescript
import { useTranslation } from '@/composables/useTranslation'

export function MyComponent() {
  const { translate, loading, error } = useTranslation()
  
  const handleTranslate = async () => {
    const result = await translate('Hello', 'en', 'zh')
    console.log(result) // "你好"
  }
}
```

### 直接调用 API

```javascript
// 单文本翻译
POST /api/translate
{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "zh"
}

// 批量翻译
POST /api/translate/batch
{
  "texts": ["Hello", "World"],
  "sourceLanguage": "en",
  "targetLanguage": "zh"
}

// 健康检查
GET /api/health
```

## 🌐 支持的语言

| 代码 | 语言 |
|------|------|
| auto | 自动检测 |
| zh | 简体中文 |
| zh-TW | 繁体中文 |
| en | 英文 |
| ja | 日文 |
| ko | 韩文 |
| es | 西班牙文 |
| fr | 法文 |
| de | 德文 |
| tr | 土耳其文 |
| ru | 俄文 |
| pt | 葡萄牙文 |
| vi | 越南文 |
| ms | 马来西亚文 |
| th | 泰文 |
| ar | 阿拉伯文 |
| hi | 印地文 |
| it | 意大利文 |

## 🔒 安全建议

1. **不要提交 .env 文件到 Git**
   ```bash
   echo ".env" >> .gitignore
   git rm --cached .env
   ```

2. **在生产环境使用环境变量**
   - 在部署平台（如 Vercel, Railway）中设置敏感环境变量
   - 不要在客户端暴露 API 密钥

3. **请求限制**
   - 考虑在后端添加速率限制
   - 监控 API 使用情况避免超额费用

## 📊 腾讯云计费

- 免费额度：每月前 500 万个字符免费
- 超过部分：按字符数计费，约 ¥0.50/100 万字符
- 查看费用：[腾讯云成本管理](https://console.cloud.tencent.com/expense)

## 🐛 常见问题

### 问：提示 "Translation service is not configured"
**答：** 检查 `.env` 文件中是否正确填入了 `TENCENT_CLOUD_SECRET_ID` 和 `TENCENT_CLOUD_SECRET_KEY`，且后端服务已启动。

### 问：翻译很慢
**答：** 
- 首次请求会较慢，后续会使用缓存
- 检查网络连接和腾讯云服务状态
- 考虑使用批量翻译 API 提高效率

### 问：出现跨域错误
**答：** 后端已配置 CORS，确保前端请求地址是 `http://localhost:3000/api`

### 问：如何升级到正式账户
**答：** 登录腾讯云 -> 账户中心 -> 认证信息 -> 完成实名认证

## 📚 相关资源

- [腾讯云机器翻译文档](https://cloud.tencent.com/document/product/551)
- [API 参考](https://cloud.tencent.com/document/api/551/15619)
- [SDK 仓库](https://github.com/TencentCloud/tencentcloud-sdk-nodejs)

## 💡 下一步建议

1. **添加翻译历史记录** - 在 localStorage 或数据库中保存翻译记录
2. **自定义字典** - 添加特定领域的术语映射
3. **离线翻译** - 考虑集成离线翻译库作为备选方案
4. **性能优化** - 实现更智能的缓存策略
5. **质量反馈** - 让用户反馈翻译质量，改进模型训练数据

---

有任何问题或建议，欢迎提交 Issue 或 PR！
