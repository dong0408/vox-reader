# 🎯 你的实际部署情况 - 快速解决方案

## 当前状态
```
✅ /var/www/vox_reader/     ← dist 文件，前端能访问
✅ /home/vox_reader/        ← 完整项目，包括后端
❌ 翻译 API 不工作          ← 因为后端服务没启动
```

---

## ⚡ 问题原因（一句话）
前端代码在 `/var/www/vox_reader` 中，但后端服务（API）没有运行，所以翻译请求失败。

---

## 🚀 解决方案（3 步）

### 第1步：配置 Nginx（一次性）

在你的服务器上执行：

```bash
sudo bash /home/vox_reader/setup-vox-final.sh
```

这会自动：
- 配置 Nginx 反向代理
- 将 `/var/www/vox_reader` 设置为前端
- 将 `/api/*` 请求转发到后端服务

### 第2步：启动后端服务

在你的服务器上执行：

```bash
cd /home/vox_reader
node server/index.mjs
```

这样后端服务就会在 `localhost:3000` 上运行。

### 第3步：访问应用

打开浏览器，访问你的服务器 IP（例如 http://117.72.149.28）

现在你应该能看到前端界面，**翻译功能也应该能工作了**。

---

## 🔍 验证是否工作

### 测试 1：打开应用
```
在浏览器中打开: http://你的IP
应该看到应用界面
```

### 测试 2：检查后端是否运行
```bash
curl http://127.0.0.1:3000/api/health
```
应该返回：
```json
{"status":"ok","translationServiceAvailable":true}
```

### 测试 3：测试翻译 API
在浏览器中：
1. 按 F12 打开开发者工具
2. 尝试使用翻译功能
3. 查看 Network 标签中是否看到 `/api/translate` 请求成功（绿色）

### 测试 4：查看浏览器日志
在开发者工具的 Console 标签中，应该看到类似：
```
✓ Using relative path /api
✅ Translation success: ...
```

---

## 🛠️ 如果还是有问题

### 问题 1：后端启动失败

**检查**：
```bash
# 检查依赖是否安装
cd /home/vox_reader
ls node_modules/

# 如果没有，安装依赖
npm install
# 或
pnpm install
```

**启动**：
```bash
# 查看错误输出
node server/index.mjs
```

### 问题 2：Nginx 配置失败

**检查**：
```bash
sudo nginx -t
```

如果有错误，查看输出并修复。

### 问题 3：翻译还是失败

**检查环境变量**：
```bash
cd /home/vox_reader
grep TENCENT_CLOUD_SECRET_ID .env.local
```

确保腾讯云凭证已配置。

**查看后端日志**：
```bash
# 运行后端时，查看输出的错误信息
node server/index.mjs
```

---

## 📋 标准操作流程

### 首次部署
```bash
# 1. 在服务器上配置 Nginx（一次）
sudo bash /home/vox_reader/setup-vox-final.sh

# 2. 启动后端服务
cd /home/vox_reader
nohup node server/index.mjs > backend.log 2>&1 &

# 3. 验证
curl http://127.0.0.1/api/health

# 4. 访问
http://你的IP
```

### 后续更新前端
```bash
# 在本地构建
npm run build

# 上传新的 dist 文件
scp -r dist/* root@你的IP:/var/www/vox_reader/
```

### 重启后端服务
```bash
# 查看进程
ps aux | grep "node server"

# 杀死进程
kill PID号

# 重新启动
cd /home/vox_reader
node server/index.mjs
```

---

## 🏗️ 最终架构图

```
用户浏览器
    ↓ http://你的IP
Nginx (端口 80)
    ├─ / → 前端文件 (/var/www/vox_reader/dist)
    └─ /api/* → 反向代理到 localhost:3000
    ↓
Node.js 后端 (localhost:3000)
    ├─ /api/translate → 腾讯云翻译 API
    └─ /api/health → 健康检查
```

**关键点**：用户只需要记住一个 IP 地址，Nginx 会自动路由请求到正确的地方。

---

## ✅ 清单

完成以下操作：

- [ ] 运行 `sudo bash /home/vox_reader/setup-vox-final.sh`
- [ ] 启动后端: `cd /home/vox_reader && node server/index.mjs`
- [ ] 打开浏览器访问你的 IP
- [ ] 测试翻译功能
- [ ] 检查浏览器控制台确认没有错误

---

## 💡 关键要点

1. **前端在 /var/www/vox_reader** - 这是静态文件，不能执行代码
2. **后端在 /home/vox_reader** - 这才能执行 Node.js 代码和处理 API
3. **Nginx 的作用** - 把前端和后端连接在一起，避免跨域问题
4. **后端必须运行** - 光有前端文件是不够的，API 服务需要时刻在运行

---

## 📞 还有问题？

查看详细调试指南：`DEPLOYMENT-GUIDE.md`

快速诊断：`bash check-deployment.sh`
