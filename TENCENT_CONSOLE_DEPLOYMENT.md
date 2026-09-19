# 腾讯云控制台手动部署指南（最简单）

## 🎯 问题根源

你的 EdgeOne 返回 HTML 是因为 `/api/translate` 请求没有被路由到后端云函数。
后端云函数可能没有部署，或者 EdgeOne 的源站配置指向错误。

## ✅ 完整解决方案

### 步骤 1️⃣：在腾讯云控制台部署云函数

1. **登录腾讯云控制台**
   - 打开：https://console.cloud.tencent.com
   - 登录你的账号

2. **进入云函数 SCF 服务**
   - 搜索 "云函数" 或 "SCF"
   - 点击进入

3. **创建新函数**
   - 点击 "新建"
   - 配置如下：
     ```
     函数名称: vox-reader-translate
     运行环境: Node.js 18.x
     创建方式: 从头开始编写
     ```

4. **配置函数代码**
   - 在代码编辑器中，将 `api/translate/index-final.js` 的内容复制进去
   - 执行方法改为：`index.main_handler`

5. **配置环境变量**
   - 点击"环境变量"标签
   - 添加两个环境变量：
     ```
     TENCENT_CLOUD_SECRET_ID = 你的 SECRET_ID
     TENCENT_CLOUD_SECRET_KEY = 你的 SECRET_KEY
     ```

   > 获取凭证：访问 https://console.cloud.tencent.com/cam/capi

6. **配置超时时间**
   - 超时时间设为：30 秒（或更长）

7. **保存并部署**
   - 点击 "保存"
   - 点击 "部署"

---

### 步骤 2️⃣：创建 API 网关

1. **返回云函数列表**
   - 找到 `vox-reader-translate` 函数

2. **添加触发器**
   - 点击函数名进入详情
   - 点击 "触发器管理"
   - 点击 "创建触发器"
   - 配置如下：
     ```
     触发器类型: API网关
     创建方式: 新建API服务
     API服务: 新建（或选择现有）
     请求方法: POST
     发布环境: 发布环境
     ```

3. **记录 API 网关地址**
   - 创建完后会显示一个 URL，类似：
     ```
     https://service-xxx.scf.tencentserverless.com/release/vox-reader-translate
     ```
   - **复制这个地址，下一步需要用到**

---

### 步骤 3️⃣：配置 EdgeOne 源站

1. **登录腾讯云 EdgeOne 控制台**
   - 访问：https://console.cloud.tencent.com/edgeone

2. **选择你的站点**
   - 找到 `vox-reader-dp5f1q3ek4pm.edgeone.cool`

3. **进入源站配置**
   - 左侧菜单 → "源站配置" 或 "源站"

4. **添加回源规则**
   - 点击 "添加规则"
   - 配置如下：
     ```
     匹配路径: /api/*
     源站类型: 指定源站地址
     源站地址: [粘贴第2步的 API 网关 URL]
     https 回源: 开启
     ```

5. **保存配置**
   - 点击 "保存"
   - 等待配置生效（通常需要 1-5 分钟）

---

### 步骤 4️⃣：验证部署

#### 方式 A：直接测试 API

```bash
# 测试云函数是否工作
curl -X POST "https://service-xxx.scf.tencentserverless.com/release/vox-reader-translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}'

# 应该返回类似：
# {"translatedText":"你好","sourceLanguage":"auto","targetLanguage":"zh"}
```

#### 方式 B：通过 EdgeOne 测试

```bash
# 等待 EdgeOne 配置生效后测试
curl -X POST "https://vox-reader-dp5f1q3ek4pm.edgeone.cool/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}'

# 应该返回 JSON 而不是 HTML
```

#### 方式 C：通过应用测试

1. 打开应用：https://vox-reader-dp5f1q3ek4pm.edgeone.cool
2. 打开浏览器开发者工具（F12）
3. 尝试翻译功能
4. 检查 Network 标签中的请求

---

## ⚠️ 常见问题

### Q: 云函数部署后返回 500 错误？
**A:** 可能的原因：
1. 环境变量未正确配置
2. 腾讯云凭证无效或过期
3. 账户未开通翻译服务

**解决：**
- 检查环境变量是否正确
- 在腾讯云控制台查看云函数日志

### Q: EdgeOne 仍然返回 HTML？
**A:** 可能的原因：
1. 回源规则未生效（需要 1-5 分钟）
2. 源站地址配置错误
3. API 网关地址拷贝错误

**解决：**
- 等待几分钟后重试
- 验证源站地址是否正确
- 检查 EdgeOne 的请求日志

### Q: 如何查看云函数日志？
**A:** 
1. 进入云函数详情
2. 点击"日志查询"标签
3. 查看最近的请求日志

### Q: 腾讯云翻译 API 收费吗？
**A:** 
- 免费额度：每月 500 万字
- 超出部分：按量计费（通常很便宜）
- 查看价格：https://cloud.tencent.com/product/tmt/pricing

---

## 🚀 快速排查清单

- [ ] 云函数已创建并部署
- [ ] 环境变量已配置（SECRET_ID 和 SECRET_KEY）
- [ ] API 网关已创建并记录地址
- [ ] EdgeOne 源站规则已添加 (`/api/*`)
- [ ] 源站地址指向 API 网关
- [ ] 云函数可以直接调用（curl 测试）
- [ ] EdgeOne 配置已生效（等待 1-5 分钟）
- [ ] 通过 EdgeOne 可以调用 API（返回 JSON 而不是 HTML）
- [ ] 应用中的翻译功能正常

---

## 📞 需要帮助？

如果仍有问题，请提供：
1. 云函数的日志内容
2. curl 测试的返回结果
3. 浏览器 Network 标签的截图

这样可以快速诊断问题。
