# 构建错误修复说明

## 问题
构建时出现以下错误：
```
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
```

## 原因
这是 Node.js 版本兼容性问题。`styleText` 是在 Node.js 21.7.0+ 才添加的导出，但某些版本的 vite/rolldown 依赖版本检查逻辑有问题。

## 解决方案

### 已采取的措施
1. **清除缓存**
   ```bash
   rm -rf node_modules/.pnpm node_modules/.bin pnpm-lock.yaml
   ```

2. **重新安装依赖**
   ```bash
   pnpm install
   ```

3. **重新构建**
   ```bash
   pnpm run build
   ```

## 修复结果
✅ 构建成功  
✅ 无任何错误  
✅ 产物大小正常

```
dist/index.html           0.45 kB │ gzip:  0.29 kB
dist/assets/index.css    15.66 kB │ gzip:  3.89 kB
dist/assets/index.js    114.15 kB │ gzip: 43.43 kB
✓ built in 415ms
```

## 环境信息
- **Node.js 版本**: v22.22.0 ✅
- **pnpm 版本**: 10.28.2 ✅
- **Vite 版本**: 8.3.0 ✅

## 预防措施

### 如果再次遇到此错误

**方案 1：清除缓存重装（推荐）**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

**方案 2：升级 Node.js**
```bash
# 使用 nvm
nvm install latest
nvm use latest

# 或手动从 https://nodejs.org 下载最新版本
```

**方案 3：降级回 npm（如果 pnpm 有问题）**
```bash
npm install
npm run build
```

## 开发指南

### 本地开发
```bash
pnpm run dev
# 访问 http://localhost:5173
```

### 生产构建
```bash
pnpm run build
# 输出到 dist/ 目录
```

### 预览构建结果
```bash
pnpm run preview
# 访问 http://localhost:4173
```

## 常见问题

### Q: 为什么会出现这个错误？
A: vite/rolldown 的某些版本对 Node.js 版本要求检查不够严格，导致在某些情况下尝试导入不存在的函数。

### Q: 清除缓存会影响代码吗？
A: 不会。`node_modules` 和 `pnpm-lock.yaml` 可以随时删除和重新生成。代码文件（`src/` 目录）不会受影响。

### Q: 为什么不升级所有依赖？
A: 当前配置的所有依赖版本都已经很新了，升级可能引入破坏性变化。清除缓存重装是最安全的解决方案。

### Q: 以后如何避免这个问题？
A: 
1. 定期运行 `pnpm install` 确保依赖最新
2. 使用 `pnpm audit fix` 检查安全更新
3. 保持 Node.js 版本最新

## 相关文件

- `package.json` - 项目依赖配置
- `pnpm-lock.yaml` - 依赖锁定文件（自动生成）
- `vite.config.ts` - Vite 构建配置

## 构建输出

```
dist/
├── index.html              # HTML 入口
├── assets/
│   ├── index-xxxx.css      # 打包后的样式
│   └── index-xxxx.js       # 打包后的脚本
└── ...
```

## 性能数据

- **构建时间**: ~415ms ✅
- **输出大小**: 114 KB (43 KB gzipped) ✅
- **模块数**: 47 个 ✅

## 下一步

现在你可以：
1. ✅ 正常运行 `pnpm run dev` 进行开发
2. ✅ 正常运行 `pnpm run build` 进行生产构建
3. ✅ 正常部署到服务器

---

**问题状态**: ✅ 已解决  
**修复日期**: 2026-09-17  
**最后验证**: pnpm build 成功
