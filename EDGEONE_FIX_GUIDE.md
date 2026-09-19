# EdgeOne 源站规则完整修复指南

## 问题诊断

**症状：** API 返回 200 但内容是 index.html

**根本原因：** EdgeOne 的源站规则没有正确将 `/api/*` 转发到后端

**解决方案：** 重新配置 EdgeOne 的源站规则

---

## ✅ 修复步骤（按顺序执行）

### 步骤 1️⃣：登录 EdgeOne 控制台

1. 打开：https://console.cloud.tencent.com/edgeone
2. 选择你的站点：`vox-reader-dpofy45jadbb.edgeone.cool`

### 步骤 2️⃣：找到源站配置

**重要：** 不同的 EdgeOne 版本菜单位置可能不同

**路径 A（较新版本）：**
```
左侧菜单 → 加速 → 源站
```

**路径 B（较旧版本）：**
```
左侧菜单 → 源站配置
```

**路径 C（某些账户）：**
```
左侧菜单 → 回源规则
```

如果找不到，搜索 "源站" 或 "origin"。

### 步骤 3️⃣：删除旧的 API 规则（如果存在）

1. 找到任何包含 `/api` 或 `/api/*` 的规则
2. 点击删除（如果已有规则，先删除旧的）

### 步骤 4️⃣：添加正确的新规则

**添加规则配置：**

| 项目 | 值 | 说明 |
|------|-----|------|
| **匹配路径** | `/api/*` | 匹配所有 /api 开头的请求 |
| **源站类型** | 指定源站地址 | 不要用源站组 |
| **源站地址** | `https://service-xxxxx.scf.tencentserverless.com/release/vox-reader-translate` | 你的云函数 API 网关地址 |
| **HTTPS 回源** | ✅ 启用 | 必须启用 |
| **Host Header** | 保持原值或填 `auto` | 默认即可 |
| **超时时间** | 30 秒或更长 | 默认即可 |

### 步骤 5️⃣：配置细节检查

重要检查项：

- [ ] 路径是 `/api/*` 而不是 `/api` 或 `/api/`
- [ ] 源站地址是完整的 HTTPS 链接
- [ ] 源站地址以 `.scf.tencentserverless.com/release/...` 结尾
- [ ] 没有在源站地址后面添加 `/`
- [ ] HTTPS 回源已启用
- [ ] 规则已保存

### 步骤 6️⃣：保存配置

1. 点击 "保存" 或 "应用"
2. 等待配置生效（通常 1-5 分钟）
3. 控制台会显示 "配置已保存" 或类似提示

### 步骤 7️⃣：清除缓存

在 EdgeOne 控制台中：

1. 找到 "缓存管理" 或 "清除缓存"
2. 清除以下路径：
   ```
   /api/*
   /
   ```
3. 等待缓存清除完成

### 步骤 8️⃣：测试

```bash
# 测试 API 是否正常工作
curl -X POST "https://vox-reader-dpofy45jadbb.edgeone.cool/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}'

# ✅ 应该返回：
# {"translatedText":"你好","sourceLanguage":"auto","targetLanguage":"zh"}

# ❌ 如果仍返回 HTML，继续下面的排查
```

---

## 🔍 如果仍未解决

### 排查清单

1. **验证云函数是否真的工作**

```bash
# 直接测试云函数 API（不通过 EdgeOne）
# 从腾讯云控制台复制你的 API 网关地址

curl -X POST "https://service-xxxxx.scf.tencentserverless.com/release/vox-reader-translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}'

# 必须返回 JSON，否则云函数本身有问题
```

2. **检查 EdgeOne 的请求日志**

- 进入 EdgeOne 控制台
- 找到 "日志分析" 或 "实时日志"
- 搜索 `/api/translate` 的请求
- 查看：
  - 是否有规则匹配（是否显示被转发）
  - HTTP 状态码是否正确
  - 是否有缓存命中标志

3. **查看 EdgeOne 的所有源站规则**

- 有时候可能是其他规则的优先级更高
- 或者有一个通配符规则 `/*` 返回 index.html
- 检查规则的**优先级**（通常 `/api/*` 应该在 `/*` 之前）

4. **临时禁用其他规则测试**

- 如果有多条规则，暂时禁用所有规则
- 只保留 `/api/*` 规则
- 测试是否工作

---

## 💡 常见配置错误

### 错误 1：路径写法错误

❌ **错误的写法：**
```
/api        ← 不匹配 /api/translate
/api/       ← 不匹配 /api/translate
/api*       ← 写法错误
```

✅ **正确的写法：**
```
/api/*      ← 匹配 /api/anything
```

### 错误 2：源站地址错误

❌ **错误的写法：**
```
http://localhost:3000        ← HTTP 而不是 HTTPS
https://api.example.com      ← 不是你的云函数地址
https://service-xxx...com/   ← 末尾多了 /
```

✅ **正确的写法：**
```
https://service-xxxxx.scf.tencentserverless.com/release/vox-reader-translate
```

### 错误 3：规则优先级问题

如果有这样的规则顺序：

```
规则 1: /* → index.html    ← 优先级高
规则 2: /api/* → 云函数    ← 优先级低
```

结果：`/api/translate` 会被规则 1 拦截，返回 index.html

**解决：** 确保 `/api/*` 的规则优先级在 `/*` 之前

---

## 🚀 一键诊断脚本

运行以下脚本快速诊断问题：

```bash
#!/bin/bash

echo "1. 测试云函数 API..."
curl -s -X POST "https://service-xxxxx.scf.tencentserverless.com/release/vox-reader-translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"test","sourceLanguage":"auto","targetLanguage":"zh"}' | grep -o "translatedText\|<!DOCTYPE"

echo ""
echo "2. 测试 EdgeOne API..."
curl -s -X POST "https://vox-reader-dpofy45jadbb.edgeone.cool/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"test","sourceLanguage":"auto","targetLanguage":"zh"}' | grep -o "translatedText\|<!DOCTYPE"

echo ""
echo "如果输出都是 translatedText，说明都工作正常"
echo "如果 EdgeOne 是 <!DOCTYPE，说明没有正确转发"
```

---

## 📞 需要帮助？

如果按照上述步骤仍未解决，请提供：

1. EdgeOne 源站规则的截图（隐藏敏感信息）
2. 云函数 API 网关地址（隐藏部分）
3. 诊断脚本的输出结果
4. EdgeOne 日志中 `/api/translate` 的请求记录

这样我可以帮你精确定位问题。
