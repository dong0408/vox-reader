# 腾讯云 EdgeOne 部署完整指南

## 问题分析

你的应用是通过 GitHub 直接托管在 EdgeOne 上的，但没有后端服务。当前端请求 `/api/translate` 时，EdgeOne 返回了 `index.html`（SPA 的默认行为）。

## 解决方案

使用腾讯云云函数（Serverless Functions）部署后端 API，无需管理服务器。

## 部署步骤

### 1. 安装腾讯云 CLI 工具

```bash
# 安装 Serverless 框架
npm install -g serverless

# 初始化腾讯云凭证
serverless credentials set --provider tencent --id YOUR_SECRET_ID --key YOUR_SECRET_KEY
```

获取凭证方法：
- 登录腾讯云控制台：https://console.cloud.tencent.com
- 进入 "访问管理" -> "API 密钥管理"
- 创建新的密钥对

### 2. 部署后端服务

```bash
# 方法 A：使用 Serverless 框架（推荐）
serverless deploy

# 方法 B：直接在腾讯云控制台部署
# 1. 进入 "云函数 SCF" 服务
# 2. 创建新函数
# 3. 上传 api/translate/index.js
# 4. 配置环境变量 (见下面)
# 5. 添加 API 网关触发器（路径：/api/translate）
```

### 3. 配置环境变量

在云函数的"函数配置"中添加：
```
TENCENT_CLOUD_SECRET_ID = your_secret_id
TENCENT_CLOUD_SECRET_KEY = your_secret_key
```

### 4. 配置 EdgeOne 路由规则

在腾讯云 EdgeOne 控制台：

1. 进入 **源站配置**
2. 添加回源规则：
   ```
   路径：/api/*
   源站类型：API 网关
   源站地址：[你的云函数 API 网关地址]
   ```

3. 或者添加重定向规则：
   ```
   路径：/api/*
   目标地址：https://[scf-domain].tencentserverless.com/api/*
   ```

### 5. 重新构建并推送

```bash
# 重新构建前端（已包含 API 配置）
npm run build

# 推送到 GitHub（会自动触发 EdgeOne 部署）
git add .
git commit -m "feat: 部署腾讯云云函数后端服务"
git push origin main
```

## 验证部署

### 测试 API 是否工作

```bash
# 直接测试云函数
curl -X POST https://your-scf-domain.tencentserverless.com/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}'

# 或通过应用测试
# 1. 打开应用：https://vox-reader-dp03a5l0223c.edgeone.cool
# 2. 打开开发者工具 (F12)
# 3. 尝试翻译功能
# 4. 查看 Network 标签确认请求正常
```

### 查看日志

在腾讯云控制台查看云函数的日志：
- 云函数 SCF -> 函数列表 -> vox-reader-translate -> 日志

## 可选：简化配置

如果只想快速测试，可以暂时将 API 地址改为指向云函数：

在 `.env.local` 中设置：
```
VITE_API_BASE_URL=https://your-scf-domain.tencentserverless.com/api
```

然后重新构建：
```bash
npm run build
git push origin main
```

## 成本估算

腾讯云云函数的免费额度：
- 每月 100 万次调用
- 每月 400,000 GB·秒

对于个人使用基本不产生费用。

## 常见问题

### Q: API 请求超时？
A: 检查云函数的超时设置，改为 30 秒或更长

### Q: 环境变量不生效？
A: 确保在云函数配置中正确设置了环境变量，然后重新部署

### Q: CORS 错误？
A: 确保云函数配置了 CORS（在 serverless.yml 中已设置 cors: true）

### Q: 翻译返回错误？
A: 检查腾讯云凭证是否正确配置，查看云函数日志了解详细错误

## 更多资源

- 腾讯云云函数文档：https://cloud.tencent.com/document/product/583
- Serverless 框架文档：https://www.serverless.com/framework/docs
- 腾讯云翻译 API：https://cloud.tencent.com/document/product/551

## 快速排查脚本

如果有问题，运行此脚本诊断：

```bash
# 检查云函数是否部署
serverless info

# 查看实时日志
serverless logs

# 重新部署
serverless deploy --force
```
