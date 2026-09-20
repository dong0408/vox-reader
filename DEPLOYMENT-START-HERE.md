# vox-reader 部署问题 - 完整解决方案

## 📌 你的问题

```
❌ 无法通过 http://117.72.149.28:5173/ 访问
❌ 使用 dist 文件后翻译 API 无法工作
```

---

## 🎯 根本原因（一句话总结）

| 问题 | 原因 |
|------|------|
| 5173 无法访问 | 启动脚本只运行后端，前端服务没启动 |
| API 无法工作 | 硬编码的绝对 API URL 导致跨域请求失败 |

---

## ⚡ 快速修复（选择一个）

### 方案 A: 最快 (5分钟，推荐) ⭐⭐⭐

```bash
# 1. 修改 .env.local
# 删除这一行:
# VITE_API_BASE_URL=http://117.72.149.28:3000/api

# 2. 重新构建
npm run build

# 3. 上传到服务器并启动 Nginx
scp -r dist/ root@117.72.149.28:/var/www/vox_reader/
ssh root@117.72.149.28
cd ~/vox-reader
sudo bash setup-nginx.sh
./start-production.sh backend-only
```

然后访问: **http://117.72.149.28:5173/**

### 方案 B: 详细步骤

详见 **QUICK-FIX.md** 中的完整步骤和故障排查

---

## 📂 为你创建的文件

为了完全解决这个问题，我创建了以下文件：

### 🔴 必读文件

1. **QUICK-FIX.md** ⭐⭐⭐
   - 立即执行的 3 步修复
   - 包含验证和故障排查
   - **首先阅读这个**

2. **SOLUTION-SUMMARY.md** ⭐⭐
   - 完整的问题分析
   - 架构图和对比表
   - 关键概念讲解

### 🟡 部署工具

3. **start-production.sh** (改进的启动脚本)
   ```bash
   ./start-production.sh all              # 启动前后端
   ./start-production.sh backend-only     # 只启动后端（推荐生产）
   ./start-production.sh frontend-only    # 只启动前端
   ./start-production.sh show-nginx       # 显示 Nginx 配置
   ```

4. **setup-nginx.sh** (自动化 Nginx 部署)
   ```bash
   sudo bash setup-nginx.sh  # 一键配置
   ```

5. **check-deployment.sh** (诊断工具)
   ```bash
   bash check-deployment.sh  # 检查部署配置
   ```

### 🟠 配置文件

6. **DEPLOYMENT-GUIDE.md**
   - 完整的部署指南
   - 包含 Nginx 配置示例
   - 详细的故障排查

7. **.env.production**
   - 生产环境配置示例

---

## 🚀 立即开始

### 步骤 1: 理解问题 (1分钟)
```bash
cat SOLUTION-SUMMARY.md
```

### 步骤 2: 执行修复 (5分钟)
```bash
cat QUICK-FIX.md  # 按照步骤执行
```

### 步骤 3: 验证成功
- 打开浏览器访问: http://117.72.149.28:5173/
- 测试翻译功能
- 查看浏览器控制台确保没有错误

### 步骤 4: 需要帮助
- 遇到问题? 查看 DEPLOYMENT-GUIDE.md 中的故障排查
- 想深入理解? 查看 SOLUTION-SUMMARY.md 中的架构说明

---

## 📊 文件速查表

| 场景 | 应该阅读 |
|------|---------|
| 快速修复 | QUICK-FIX.md |
| 理解原因 | SOLUTION-SUMMARY.md |
| 完整部署 | DEPLOYMENT-GUIDE.md |
| 故障排查 | QUICK-FIX.md 或 DEPLOYMENT-GUIDE.md |
| 检查配置 | 运行 check-deployment.sh |

---

## 💡 核心要点

### ❌ 问题代码
```bash
# .env.local
VITE_API_BASE_URL=http://117.72.149.28:3000/api
# ❌ 这会导致跨域问题
```

### ✅ 正确方式
```bash
# .env.local
# 不要设置 VITE_API_BASE_URL
# 前端代码会自动使用 /api 相对路径

# Nginx 反向代理配置会将 /api 转发到后端
```

---

## 🎯 最终架构

```
用户浏览器 → http://117.72.149.28:5173/
                    ↓
              Nginx 服务器
              ├─ / → 前端文件 (dist)
              └─ /api/* → 后端 (3000)
                    ↓
              后端服务 (localhost:3000)
              ├─ /api/translate → 腾讯云翻译
              └─ /api/health → 健康检查
```

**关键**: 一切都通过 Nginx，没有跨域问题！

---

## ✨ 快速命令参考

```bash
# 本地开发/测试
./start-production.sh all

# 检查部署配置
bash check-deployment.sh

# 服务器部署 (首次)
sudo bash setup-nginx.sh

# 启动后端
./start-production.sh backend-only

# 重新部署 dist 文件
scp -r dist/ root@117.72.149.28:/var/www/vox_reader/

# 查看日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 📞 需要帮助?

1. **问题**: 不知道从哪里开始
   - **答**: 先读 SOLUTION-SUMMARY.md，再按 QUICK-FIX.md 操作

2. **问题**: 修复后还是无法访问
   - **答**: 查看 DEPLOYMENT-GUIDE.md 中的故障排查部分

3. **问题**: 不理解为什么这样做
   - **答**: 查看 SOLUTION-SUMMARY.md 中的"关键概念"部分

4. **问题**: 想测试前先检查配置
   - **答**: 运行 `bash check-deployment.sh`

---

## ✅ 部署检查清单

完成后检查以下项目:

- [ ] .env.local 中删除了 VITE_API_BASE_URL
- [ ] 运行了 `npm run build`
- [ ] dist 文件已上传到服务器
- [ ] Nginx 已配置并运行
- [ ] 后端服务在 3000 端口运行
- [ ] 可以访问 http://117.72.149.28:5173/
- [ ] 翻译功能正常工作
- [ ] 浏览器控制台无错误

---

## 🎓 学到的要点

1. **Vite 环境变量**: `VITE_*` 前缀的变量在编译时被替换
2. **生产部署**: 应该使用相对路径避免跨域问题
3. **反向代理**: Nginx 可以统一处理路由
4. **SPA 部署**: try_files $uri /index.html 很重要

---

**现在就开始吧！** 👉 `cat QUICK-FIX.md`
