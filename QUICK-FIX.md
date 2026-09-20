# 🚨 立即修复步骤 - vox-reader 部署问题

## 问题症状
- ❌ 无法访问 http://117.72.149.28:5173/
- ❌ 使用 dist 文件时翻译 API 失效

---

## ⚡ 3 步快速修复

### 步骤 1: 修改 .env.local 配置

**当前配置 (有问题):**
```bash
VITE_API_BASE_URL=http://117.72.149.28:3000/api
```

**修复方案:**
```bash
# 删除或注释掉这一行
# VITE_API_BASE_URL=http://117.72.149.28:3000/api

# 保留其他配置
TENCENT_CLOUD_REGION=ap-beijing
PORT=3000
```

**为什么**: 
- 构建时，`VITE_API_BASE_URL` 会被编译进 dist 文件
- 生产环境浏览器访问时会产生跨域问题
- 应该使用相对路径 `/api`，由 Nginx 反向代理处理

---

### 步骤 2: 重新构建前端

```bash
# 1. 修改 .env.local 后
# 2. 重新构建
npm run build

# 3. 确认 dist 文件已更新
ls -la dist/
cat dist/index.html | grep "api" | head -3
```

---

### 步骤 3: 在服务器上部署

**选项 A: 使用 Nginx (推荐，生产级)**

```bash
# 1. 上传新的 dist 和脚本
scp -r dist/ root@117.72.149.28:/var/www/vox_reader/
scp setup-nginx.sh start-production.sh root@117.72.149.28:~/vox-reader/

# 2. 在服务器上连接
ssh root@117.72.149.28

# 3. 配置 Nginx
cd ~/vox-reader
sudo bash setup-nginx.sh

# 4. 启动后端服务
./start-production.sh backend-only

# 5. 验证
curl http://127.0.0.1:5173/
curl http://127.0.0.1:3000/api/health
```

**选项 B: 快速启动 (仅用于测试)**

```bash
# 在服务器上
cd ~/vox-reader
./start-production.sh all

# 然后访问
# 前端: http://117.72.149.28:5173
# 后端: http://117.72.149.28:3000/api
```

---

## 🔍 验证部署成功

### 验证 1: 前端可访问
```bash
# 从任何地方执行
curl -I http://117.72.149.28:5173/
# 应该返回 200 OK
```

### 验证 2: 后端 API 工作
```bash
curl http://117.72.149.28:3000/api/health
# 应该返回 {"status":"ok","translationServiceAvailable":true}
```

### 验证 3: 在浏览器中测试
1. 打开 http://117.72.149.28:5173/
2. 打开浏览器开发者工具 (F12)
3. 尝试使用翻译功能
4. 在 Network 标签中查看请求是否成功
5. 在 Console 中应该看到类似消息:
   ```
   ✓ Using relative path /api
   ✅ Translation success: ...
   ```

---

## 🛠️ 故障排查

### 问题: 访问 5173 显示 404/502

**检查列表:**
```bash
# 1. Nginx 是否运行
sudo systemctl status nginx

# 2. 前端文件是否存在
ls -la /var/www/vox_reader/index.html

# 3. Nginx 配置
sudo nginx -t

# 4. 查看错误日志
sudo tail -50 /var/log/nginx/error.log
```

**修复:**
```bash
# 重新复制文件
sudo cp -r dist/* /var/www/vox_reader/
sudo chown -R www-data:www-data /var/www/vox_reader/

# 重启 Nginx
sudo systemctl restart nginx
```

### 问题: 翻译 API 返回错误

**检查:**
```bash
# 1. 打开浏览器 F12 → Network 标签
# 2. 看 /api/translate 请求

# 3. 命令行测试
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}'

# 4. 检查后端日志
ps aux | grep "node server"
# 查看后端是否输出错误
```

**可能的原因:**
- 后端未运行 → 执行 `./start-production.sh backend-only`
- 腾讯云凭证错误 → 检查 `echo $TENCENT_CLOUD_SECRET_ID`
- API 未代理 → 检查 Nginx 配置 `sudo nginx -T`

---

## 📋 最终检查清单

部署完成后检查:

```bash
# 后端服务
[ ] 后端在 3000 端口运行
[ ] 健康检查通过: curl http://localhost:3000/api/health
[ ] 腾讯云凭证已设置

# 前端文件
[ ] dist 目录已复制到 /var/www/vox_reader
[ ] dist/index.html 存在
[ ] .env.local 中没有硬编码 VITE_API_BASE_URL

# Nginx
[ ] Nginx 已安装并运行
[ ] Nginx 配置通过验证 (sudo nginx -t)
[ ] /etc/nginx/sites-enabled/vox-reader 存在

# 访问测试
[ ] http://117.72.149.28:5173/ 可访问
[ ] http://117.72.149.28:3000/api/health 返回 200
[ ] 翻译功能正常工作
```

---

## 📞 需要帮助?

### 查看详细指南
```bash
cat DEPLOYMENT-GUIDE.md
```

### 运行诊断工具
```bash
bash check-deployment.sh
```

### 查看日志
```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# 后端输出
# （后端运行时的 console.log）
```

---

## 💡 关键要点总结

| 问题 | 根本原因 | 解决方案 |
|------|---------|---------|
| 无法访问 5173 | 启动脚本只启动后端 | 使用 Nginx 提供前端文件 |
| dist 翻译失效 | API_BASE_URL 硬编码为绝对URL | 删除 VITE_API_BASE_URL，使用相对 /api |
| 跨域错误 | 前后端不同域 | Nginx 在同一域反向代理 |
| 环境变量无效 | 构建时编译，但文件中没有变量 | 在服务器上通过 export 设置环境变量 |
