# vox-reader 生产部署指南

## 🎯 问题分析

你遇到的两个问题的根本原因：

### 问题1: 无法访问 http://117.72.149.28:5173/
- **原因**: 启动脚本只启动了后端（3000端口），没有启动前端服务
- **症状**: 5173 端口无任何响应

### 问题2: 使用 dist 文件时翻译 API 无法工作
- **原因**: 前端代码中硬编码了 `http://117.72.149.28:3000/api` 的绝对URL
- **症状**: 浏览器端的跨域请求被阻止或连接失败
- **根本问题**: 应该使用相对路径 `/api`，由 Nginx 反向代理转发

---

## ✅ 完整解决方案

### 架构图
```
用户请求
   ↓
浏览器访问 http://117.72.149.28:5173
   ↓
Nginx (监听 5173)
   ├─ 静态请求 (/, /index.html, *.js, *.css)
   │  └─→ /var/www/vox_reader/dist (前端文件)
   │
   └─ API 请求 (/api/*)
      └─→ 代理到 localhost:3000 (后端服务)
```

### 第1步: 修改 Vite 构建配置

编辑 `vite.config.ts`，确保前端在生产环境使用相对 API 路径：

```typescript
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import path from 'path'

export default defineConfig({
  plugins: [UnoCSS(), vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 添加以下配置确保相对路径正常工作
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### 第2步: 环境变量配置

**重要**: 不要在 `.env.local` 中设置 `VITE_API_BASE_URL` 的绝对URL！

修改 `.env.local`:
```bash
# 删除或注释掉这行:
# VITE_API_BASE_URL=http://117.72.149.28:3000/api

# 其他配置保持不变
TENCENT_CLOUD_SECRET_ID=your-secret-id
TENCENT_CLOUD_SECRET_KEY=your-secret-key
TENCENT_CLOUD_REGION=ap-beijing
PORT=3000
```

前端代码会自动使用 `/api` 相对路径（见 `src/lib/translation/api.ts` 第18-21行）。

### 第3步: 在服务器上部署

**方式A: 推荐 - 使用 Nginx + 后端分离**

```bash
# 1. 在本地构建
npm run build

# 2. 上传 dist 目录到服务器
scp -r dist/ root@117.72.149.28:/var/www/vox_reader/

# 3. 在服务器上配置 Nginx
sudo bash setup-nginx.sh

# 4. 启动后端服务
./start-production.sh backend-only
```

**方式B: 快速测试 - 前后端一起启动**

```bash
# 在服务器上运行（不推荐用于生产）
./start-production.sh all
```

---

## 🚀 快速部署步骤

### 本地操作

```bash
# 1. 清理环境
rm -rf dist node_modules

# 2. 安装依赖
pnpm install

# 3. 构建前端
npm run build

# 4. 验证构建
ls -la dist/

# 5. 上传到服务器
scp -r dist/ root@117.72.149.28:/var/www/vox_reader/
scp setup-nginx.sh start-production.sh root@117.72.149.28:~/
```

### 服务器操作

```bash
# 1. 配置 Nginx
sudo bash setup-nginx.sh

# 2. 启动后端
cd ~/vox-reader
./start-production.sh backend-only

# 3. 验证访问
curl http://localhost:5173/
curl http://localhost:3000/api/health
```

---

## 🔍 故障排查

### 症状1: 访问 http://117.72.149.28:5173/ 显示 404

**检查**:
```bash
# 1. Nginx 是否运行
sudo systemctl status nginx

# 2. 前端文件是否存在
ls -la /var/www/vox_reader/

# 3. Nginx 配置是否正确
sudo nginx -t

# 4. 查看错误日志
tail -30 /var/log/nginx/error.log
```

**修复**:
```bash
# 重新构建并复制
npm run build
sudo cp -r dist/* /var/www/vox_reader/
sudo chown -R www-data:www-data /var/www/vox_reader/

# 重启 Nginx
sudo systemctl restart nginx
```

### 症状2: 翻译 API 返回错误

**检查**:
```bash
# 1. 打开浏览器控制台 (F12)
# 查看 Console 和 Network 标签
# 看翻译请求是否到达后端

# 2. 检查后端是否运行
curl http://localhost:3000/api/health

# 3. 检查翻译凭证
grep TENCENT_CLOUD_SECRET_ID ~/.env.local
# 或者在启动脚本中检查
env | grep TENCENT
```

**修复**:
```bash
# 确保后端获取到凭证
export TENCENT_CLOUD_SECRET_ID="your-id"
export TENCENT_CLOUD_SECRET_KEY="your-key"

# 重启后端
pkill -f "node server/index.mjs"
./start-production.sh backend-only
```

### 症状3: CORS 错误 (跨域问题)

**原因**: 前端硬编码了绝对URL

**检查**:
```bash
# 查看构建后的 dist/index.html
grep "117.72.149.28:3000" dist/index.html
```

**修复**:
```bash
# 1. 删除 .env.local 中的 VITE_API_BASE_URL
# 2. 确保使用相对路径 /api
# 3. 重新构建
npm run build
# 4. 重新部署到 Nginx
```

---

## 📋 检查清单

部署前检查以下项目:

- [ ] `.env.local` 中不含硬编码的 API 绝对URL
- [ ] Nginx 配置正确指向 `/var/www/vox_reader`
- [ ] 后端服务在 3000 端口运行
- [ ] 腾讯云凭证已在服务器环境变量中设置
- [ ] dist 文件已复制到服务器
- [ ] Nginx 已重启
- [ ] 防火墙已开放 5173 和 3000 端口

---

## 📞 常见问题

**Q: 为什么需要 Nginx？**
A: Nginx 可以：
- 提供静态前端文件
- 反向代理 API 请求到后端
- 统一域名（避免跨域问题）
- 提供缓存、压缩等功能

**Q: 能否不用 Nginx？**
A: 可以，但需要：
- 手动启动两个端口的服务 (5173 和 3000)
- 修改前端代码的 API_BASE_URL（不推荐）
- 前端必须显式配置 CORS

**Q: dist 文件需要每次都上传吗？**
A: 是的，每次构建后都需要：
```bash
npm run build
scp -r dist/* root@117.72.149.28:/var/www/vox_reader/
```

**Q: 如何监控生产环境？**
```bash
# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 查看后端日志
ps aux | grep "node server"

# 测试 API
curl http://localhost:3000/api/health
```

---

## 🎓 总结

| 问题 | 解决方案 |
|------|---------|
| 无法访问 5173 | 使用 Nginx 提供前端文件 |
| 翻译 API 失效 | 使用相对路径 `/api` + Nginx 反向代理 |
| 跨域错误 | 统一通过 Nginx 同一域名访问 |
| dist 文件不生效 | 不设置绝对 VITE_API_BASE_URL |
