# 🎯 针对你的具体情况 - 最简化解决方案

## 你的实际部署情况
```
前端位置: /var/www/vox_reader/  (dist 文件，能通过 IP 访问)
后端位置: /home/vox_reader/     (完整项目)
问题：    前端能看到，但翻译 API 无法使用
```

---

## 为什么翻译 API 不工作？

```
前端请求 /api/translate
    ↓
Nginx 收到请求
    ↓
❌ 没有后端服务处理，请求失败
```

**解决**: 需要启动后端服务处理 API 请求。

---

## ✅ 完整解决方案（5 分钟）

### 【第1步】在服务器上配置 Nginx

```bash
# 进入项目目录
cd /home/vox_reader

# 运行自动配置脚本
sudo bash setup-vox-final.sh
```

这个脚本会：
- ✅ 自动配置 Nginx
- ✅ 将 `/var/www/vox_reader` 设置为前端
- ✅ 将 `/api/*` 请求转发到后端

### 【第2步】启动后端服务

```bash
# 进入项目目录
cd /home/vox_reader

# 方式 A：前台运行（可看到日志，调试时使用）
node server/index.mjs

# 方式 B：后台运行（生产推荐）
nohup node server/index.mjs > backend.log 2>&1 &

# 查看日志
tail -f backend.log
```

### 【第3步】测试访问

```bash
# 测试 1：检查后端是否运行
curl http://127.0.0.1:3000/api/health
# 应返回: {"status":"ok","translationServiceAvailable":true}

# 测试 2：在浏览器中打开你的应用
http://你的IP

# 测试 3：尝试使用翻译功能
# 打开 F12 开发者工具，看是否有错误
```

---

## 🎯 完成！

现在：
- ✅ 前端可以通过 IP 访问
- ✅ 翻译 API 可以正常使用
- ✅ 所有请求都通过 Nginx 路由

---

## 🔧 常见问题

### Q: 怎样关闭后端服务？
```bash
ps aux | grep "node server"
kill PID号
```

### Q: 怎样重启后端？
```bash
cd /home/vox_reader
node server/index.mjs
```

### Q: 翻译还是不工作？

**检查 1：后端是否运行**
```bash
lsof -i :3000
```
如果没输出，说明后端没运行。

**检查 2：腾讯云凭证**
```bash
grep TENCENT_CLOUD /home/vox_reader/.env.local
```
确保配置了密钥。

**检查 3：查看错误**
```bash
# 运行后端时查看错误输出
cd /home/vox_reader
node server/index.mjs
```

### Q: 怎样更新前端代码？
```bash
# 在本地
npm run build

# 上传新的 dist
scp -r dist/* root@你的IP:/var/www/vox_reader/

# 刷新浏览器
```

---

## 📚 详细资料

如需更深入的了解，请查看：

- `YOUR-SITUATION-SOLUTION.md` - 针对你的情况的详细说明
- `DEPLOYMENT-GUIDE.md` - 完整部署指南
- `QUICK-FIX.md` - 通用修复步骤

---

## 🚀 现在就开始

```bash
# 1. 在你的服务器上执行
cd /home/vox_reader
sudo bash setup-vox-final.sh
node server/index.mjs

# 2. 打开浏览器
http://你的IP

# 3. 享受！
```

---

**就这么简单！** 🎉
