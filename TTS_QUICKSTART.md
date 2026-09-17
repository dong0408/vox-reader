# TTS 功能快速开始

## 🚀 三步启动

### 1. 启动开发服务器
```bash
cd /Users/dong/myProject/mcp_study/audio_title/vox-reader
npm run dev
```

### 2. 打开浏览器
访问 http://localhost:5173

### 3. 测试 TTS 功能

#### 步骤：
1. **上传文件**
   - 创建测试文件 `test.md` 或 `test.txt`
   - 拖放或点击上传

2. **进入阅读页面**
   - 自动导航到阅读页面
   - 显示文档内容和分段

3. **打开播放器**
   - 点击"显示播放器"按钮
   - 右侧出现音频播放器

4. **播放语音**
   - 声音默认为中文女声
   - 点击 ▶ 播放按钮
   - 等待语音生成和播放

5. **控制播放**
   - ⏸ 暂停
   - ◀/▶ 上一段/下一段
   - 拖拽进度条
   - 调节播放速度
   - 调节音量

## 📝 创建测试文件

### test.md
```markdown
# 文字转语音测试

这是一个测试文档。

我们可以测试语音合成功能。

支持多个段落的连续播放。

## 子标题

这是第二部分的内容。
```

### test.txt
```
这是一个纯文本测试文件。

系统会自动按照空行进行分段。

每个段落都会单独合成语音。

支持拖拽进度条跳转到任意位置。
```

## 🎛️ 播放器功能说明

| 功能 | 说明 |
|------|------|
| 选择声音 | 下拉菜单选择不同声音 |
| 播放/暂停 | 主要控制按钮 |
| 上一段/下一段 | 段落导航 |
| 进度条 | 拖拽跳转到任意位置 |
| 播放速度 | 支持 0.5x 到 2x |
| 音量调节 | 范围 0% 到 100% |

## ⚙️ 当前配置

- **TTS 提供者**: Mock（开发用）
- **支持语言**: 中文、英文
- **可用声音**: 4 种
- **音频格式**: WAV（Mock 版本）
- **缓存机制**: 自动缓存合成结果

## 🔧 高级配置

### 切换 TTS 提供者

如果要使用真实 TTS 服务，请参考 [TTS_IMPLEMENTATION.md](./TTS_IMPLEMENTATION.md)

### 添加自定义声音

在 `src/lib/tts/providers/mock.ts` 中修改 `voices` 数组：

```typescript
private voices: TTSVoice[] = [
  {
    id: 'my-voice',
    name: '我的声音',
    language: 'zh-CN',
    provider: 'mock',
  },
  // 继续添加...
]
```

## 🐛 常见问题

### Q: 播放器不显示
**A**: 确保：
1. 文档已成功上传和解析
2. 点击了"显示播放器"按钮
3. 浏览器控制台没有 JavaScript 错误

### Q: 音频无法播放
**A**: 检查：
1. 浏览器是否允许自动播放
2. 电脑音量是否打开
3. 查看浏览器开发者工具（F12）的 Console 标签

### Q: 生成速度很慢
**A**: 因为：
1. Mock 版本生成的是模拟音频（本不用太快）
2. 如果使用真实 TTS，速度取决于网络和服务器
3. 建议检查网络连接

### Q: 多次播放同一段落
**A**: 系统会：
1. 第一次生成音频
2. 之后从缓存读取
3. 无需重复生成

## 📊 架构概览

```
AudioPlayer.vue
     ↓
useTTS.ts (Composable)
     ↓
src/lib/tts/index.ts (Manager)
     ↓
src/lib/tts/providers/mock.ts (Provider)
     ↓
Audio ArrayBuffer
     ↓
Blob URL
     ↓
<audio> 元素播放
```

## 📚 相关文件

- `README.md` - 项目总览
- `TTS_IMPLEMENTATION.md` - 完整实现文档
- `src/lib/tts/` - TTS 库代码
- `src/components/player/AudioPlayer.vue` - 播放器组件
- `src/composables/useTTS.ts` - TTS 逻辑

## ✨ 下一步

1. **测试基础功能** - 确保播放器正常工作
2. **集成真实 TTS** - 选择 ElevenLabs 或 OpenAI
3. **添加更多语言** - 支持多语言合成
4. **优化用户体验** - 添加进度指示器等

---

**编译状态**: ✅ 通过  
**运行状态**: 🚀 可立即测试  
**功能状态**: ✅ Mock 版本完成
