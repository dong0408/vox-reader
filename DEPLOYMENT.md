# 腾讯云部署指南

## 前置条件

1. Node.js v18+ 和 pnpm
2. 腾讯云账户和凭证（SECRET_ID 和 SECRET_KEY）

## 部署步骤

### 1. 准备环境文件

在腾讯云服务器上创建 `.env.local` 文件：

```bash
# 创建文件
touch .env.local

# 编辑并添加以下内容
```

`.env.local` 内容：

```
# API 配置 - 根据实际域名修改
VITE_API_BASE_URL=https://yourdomain.com/api

# TTS 服务提供者
VITE_TTS_PROVIDER=mock

# 文件上传限制 (MB)
VITE_MAX_UPLOAD_SIZE_MB=50

# 数据存储目录
VITE_DATA_DIR=./data

# 前端翻译配置
VITE_TENCENT_CLOUD_REGION=ap-beijing

# 服务器配置
PORT=3000

# 腾讯云翻译配置（后端使用，请妥善保管）
# 获取方法：登录腾讯云控制台 -> API密钥 -> 新建密钥
TENCENT_CLOUD_SECRET_ID=你的SECRET_ID
TENCENT_CLOUD_SECRET_KEY=你的SECRET_KEY
TENCENT_CLOUD_REGION=ap-beijing
TENCENT_CLOUD_PROJECT_ID=0
```

### 2. 依赖安装

```bash
# 安装依赖
pnpm install

# 构建前端
npm run build
```

### 3. 启动应用

**方式1：本地测试（同时启动前端和后端）**

```bash
npm run dev:all
```

这会同时启动：
- 前端开发服务器 (http://localhost:5173)
- 后端服务器 (http://localhost:3000)

**方式2：生产环境启动（推荐用于腾讯云）**

```bash
# 终端1: 启动后端服务器
node server/index.mjs

# 终端2: 启动前端服务
npx vite preview --host
```

或使用 PM2 管理进程：

```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'vox-reader-backend',
      script: './server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'vox-reader-frontend',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 监看日志
pm2 logs

# 停止应用
pm2 stop all

# 重启应用
pm2 restart all
```

### 4. Nginx 反向代理配置（可选，用于 HTTPS）

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 常见问题排查

### 翻译功能不工作

**症状：** 点击翻译按钮没有反应或报错

**排查步骤：**

1. **检查后端是否运行**
   ```bash
   # 检查端口 3000 是否监听
   lsof -i :3000
   
   # 或使用 curl 测试
   curl http://localhost:3000/api/health
   ```

2. **检查环境变量**
   ```bash
   # 查看腾讯云凭证是否正确加载
   node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.TENCENT_CLOUD_SECRET_ID ? '✅ SECRET_ID 已配置' : '❌ SECRET_ID 未配置')"
   ```

3. **查看浏览器控制台错误**
   - 打开浏览器开发者工具 (F12)
   - 查看 Console 和 Network 标签中的错误信息
   - API 请求应该到 `/api/translate`

4. **查看服务器日志**
   ```bash
   # 如果使用 PM2
   pm2 logs vox-reader-backend
   
   # 如果直接运行
   # 直接查看输出日志
   ```

### HTML 错误："Unexpected token '<', "<!doctype "... is not valid JSON"

**症状：** 翻译时报告 HTML 解析错误

**原因：** 前端收到 HTML 响应而不是 JSON，通常表示：
1. 后端服务未运行
2. API 请求路由配置错误
3. Nginx 或反向代理配置不正确
4. API 基础 URL 配置错误

**解决方案：**

**方案 A：检查后端服务**
```bash
# 1. 确认后端运行
lsof -i :3000

# 2. 测试 API 是否响应
curl http://localhost:3000/api/health

# 输出应该是 JSON：
# {"status":"ok","translationServiceAvailable":true}
```

**方案 B：检查 Nginx 配置（如果使用了 Nginx）**

确保 Nginx 正确配置了 API 代理：
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

参考完整配置：`nginx.conf.example`

**方案 C：检查前端构建时的 API 配置**

在构建前端时，确保 `VITE_API_BASE_URL` 环境变量正确：
```bash
# 如果未设置，前端会使用相对路径 /api
# 这依赖于 Nginx 或其他反向代理将 /api 转发到后端

# 如果要指定完整的 API URL（不推荐用于生产）：
VITE_API_BASE_URL=https://yourdomain.com/api npm run build
```

**方案 D：使用诊断脚本**

运行诊断脚本快速定位问题：
```bash
chmod +x diagnose.sh
./diagnose.sh
```

### CORS 错误

**症状：** 浏览器报 "Access to XMLHttpRequest has been blocked by CORS policy"

**解决方案：**
- 已在 server/index.mjs 中配置宽松的 CORS 策略
- 确保 VITE_API_BASE_URL 环境变量正确设置

### 连接被拒绝

**症状：** 错误 "Failed to fetch: Connection refused"

**解决方案：**
1. 确保后端服务正在运行
2. 检查防火墙设置，确保端口 3000 开放
3. 在腾讯云控制台检查安全组规则

## 腾讯云特定配置

### 云托管服务部署

如果使用腾讯云云托管服务：

1. 上传代码到腾讯云代码库
2. 在部署配置中使用构建脚本：
   ```bash
   pnpm install
   npm run build
   ```

3. 启动命令：
   ```bash
   node server/index.mjs
   ```

4. 在腾讯云控制台设置环境变量：
   - `TENCENT_CLOUD_SECRET_ID`
   - `TENCENT_CLOUD_SECRET_KEY`
   - `TENCENT_CLOUD_REGION`
   - `PORT` (通常 3000)

### 获取腾讯云凭证

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com)
2. 进入 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 创建新的密钥对
4. 复制 SECRET_ID 和 SECRET_KEY
5. **安全提示：** 不要将凭证提交到 Git，只在部署服务器上配置

## 性能优化建议

1. **启用静态文件缓存**
   - 在 Nginx 中配置 Cache-Control 头

2. **使用 CDN**
   - 为静态资源配置 CDN 加速

3. **监控日志和性能**
   - 使用 PM2 Plus 监控
   - 定期查看翻译 API 的调用情况

## 维护和更新

```bash
# 拉取最新代码
git pull

# 安装依赖更新
pnpm install

# 重新构建
npm run build

# 重启服务（使用 PM2）
pm2 restart all
```
