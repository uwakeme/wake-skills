# 版本 A：LLM 直接写 SVG

适合 **Gemini 3 Pro / GPT-4o / Claude Sonnet 4.5** 等具备代码生成能力的模型。
输出是干净 SVG 文本，复制保存为 `.svg` 即可用。

---

## 主模板

```text
# Role
你是一名专业的前端 / SVG 工程师，专门为 GitHub README 设计 header banner。

# Task
为开源项目「{{PROJECT_NAME}}」生成一张 README Banner，输出**完整的、可直接保存的 SVG 源代码**。
只输出 SVG 代码本身，**不要任何解释、注释之外的多余文字**。

# 项目信息
- 名称：{{PROJECT_NAME}}
- 一句话简介：{{TAGLINE}}
- 技术栈标签（可选，逗号分隔）：{{TECH_STACK}}
- 副标题 / 详情（可选）：{{SUBTITLE}}
- 仓库地址（可选，角落小字）：{{REPO_URL}}

# 风格
- 整体调性：{{STYLE}}  ← 从 SKILL.md 的「风格偏好」三选一里拿
  - 极简白底：背景 #ffffff / 文字 #1f2328 / 强调色 #0969da
  - 暗色科技：背景 #0d1117 / 文字 #f0f6fc / 强调色 #58a6ff
  - 渐变彩色：背景线性渐变（2 个色） / 文字 #ffffff / 强调色按调性选

# 设计规范
- 画布尺寸：1280×320 px，viewBox="0 0 1280 320"
- 字体：SVG 标准无衬线栈
  font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
- 主标题字号 56-72px、加粗（font-weight 700）
- 副标题 20-24px、常规字重
- 排版：项目名 + tagline 左对齐，距左边 80px、距上 1/3 处
- 元素克制：最多 3 个视觉元素（标题 / 副标题 / 点缀符号）
- 技术栈标签如要放，用 <text> 平铺，**不要**花哨矩形 chip
- 角标（可选）：右下角小字写仓库 URL，font-size 14px，颜色比副色再低一档

# 必须遵守
- ❌ 禁止 emoji（GitHub 虽能渲染但显业余）
- ❌ 禁止复杂动画 / 滤镜 / SVG filter 效果
- ❌ 禁止渐变超过 3 个色标
- ❌ 禁止用 <foreignObject>（GitHub 会 strip）
- ❌ 禁止用 xlink:href / 外部资源引用
- ❌ 禁止 CSS 变量（GitHub 不解析）
- ❌ 禁止光栅图（<image> 嵌 base64 PNG）——体积会爆
- ✅ 仅用 <text>、<rect>、<circle>、<line>、<path>、<g>、<defs>、<linearGradient>、<radialGradient> 这些基础元素
- ✅ 加 <title> 和 <desc> 元素做无障碍
- ✅ text-rendering="geometricPrecision"
- ✅ 最终文件大小 < 6KB

# 输出格式
仅返回：
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" ...>
  ...
</svg>
```

不输出任何 markdown 标题、解释、前后缀。
```

---

## 动效变体（形态组合 = 全动态 或 混合中的动态位）

在主模板基础上替换「# 设计规范」与「# 必须遵守」两段，并追加动效专属约束。

### 替换「# 设计规范」段

```text
# 设计规范
- 画布尺寸：1280×320 px，viewBox="0 0 1280 320"
- 字体：SVG 标准无衬线栈，必须含中文回退
  font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', Roboto, 'Helvetica Neue', Arial, sans-serif"
- 主标题字号 56-72px、加粗（font-weight 700）
- 副标题 20-24px、常规字重
- 排版：**文字居中**（text-anchor="middle"，x 取画布中点 640）
- 元素克制：最多 4 个动画元素
- 装饰母题：**用直线型元素**（斜向光带、扫描线、斜纹、直角括号）；**禁止圆圈 / 同心环**
- 角标（可选）：底部小字写仓库 URL，font-size 13-14px
```

### 替换「# 必须遵守」段

```text
# 必须遵守
- ❌ 禁止 emoji（GitHub 虽能渲染但显业余）
- ❌ 禁止 <script> / 事件处理器（GitHub 会清洗）
- ❌ 禁止 <foreignObject>（GitHub 会 strip）
- ❌ 禁止 xlink:href / 外部资源引用
- ❌ 禁止 CSS 变量 var(--...)（GitHub 不解析）
- ❌ 禁止光栅图（<image> 嵌 base64 PNG）——体积会爆
- ❌ 禁止 CSS 的 transform 与 SVG transform 属性写在同一个元素上（CSS 会覆盖属性）→ 位移放外层 <g>，旋转缩放放内层元素
- ❌ 禁止文字做持续循环动画——文字只做一次性入场
- ❌ 禁止用圆圈 / 同心环作装饰
- ✅ 仅用 <text>、<rect>、<path>、<line>、<g>、<defs>、<linearGradient>、<radialGradient> 这些基础元素
- ✅ 加 <title> 和 <desc> 元素做无障碍，并加 role="img"
- ✅ 每个动画元素在**元素属性**上写静态基线（opacity / stroke-opacity），不依赖 CSS 才可见
- ✅ @media (prefers-reduced-motion: reduce) 的选择器必须指向**真实存在的类名**
- ✅ text-rendering="geometricPrecision"
- ✅ 最终文件大小 < 6KB
```

### 追加「# 动效要求」段（放在「# 输出格式」之前）

```text
# 动效要求
- 在 <defs> 之后加一个 <style> 段，内嵌 @keyframes 与 animation 声明
- 装饰层动效：持续循环，周期 5-30s，缓动 ease-in-out，位移幅度 ±64px 以内
- 文字入场：一次性，0.6s，ease-out，opacity 0→1 + translateY(8px)，用 both 保留终态
- 同屏动画元素 ≤ 4 个，各元素用 animation-delay 错峰（0.7s / 1.4s / 2.1s）
- 必须写：
  @media (prefers-reduced-motion: reduce){ .你的类名 { animation: none !important; } }
  选择器里的类名要和实际用到的类名**逐字一致**
- 位移动画写在**外层 <g>** 的 class 上（CSS transform），旋转/缩放写在**内层元素**的 transform 属性上
```

### 输出要求追加

```text
输出完整 SVG 源码，包含 <style> 段。只输出 SVG 代码本身，不要解释。
```

### 参考

keyframes 的具体写法见 `references/motion.md` §4，可直接照抄后改类名。

---

## 多变体（用于 A+B 模式）

> 混合模式下，奇数位候选用静态模板、偶数位候选用动效变体模板——两种模板的构图要各不相同。

如果用户选了「A+B 都要各出 3 张」，在主模板开头加：

```text
请生成 **3 个不同构图**的 SVG 变体，分别用以下侧重点：
- 变体 1：左对齐，右侧留白 + 单个几何符号点缀
- 变体 2：居中布局，标题 + 副标题居中，下方一行技术栈
- 变体 3：分栏布局，左侧文字 + 右侧装饰性几何图案（如圆/线条抽象画）

每个变体独立输出，单独用 ```svg ... ``` 包起来，前面标注「变体 1」「变体 2」「变体 3」。
```

---

## 调参技巧

- **想要更克制**：在主模板加一句"整体留白 ≥ 30%，元素之间最小间距 60px"
- **想要更精致**：加一句"主标题字距 letter-spacing 收紧 -0.02em"
- **想要更工程师风**：让模型加几条横向分隔线 / 极简坐标轴感
- **想要有 logo 占位**：在右侧加一个空心圆 `circle r="60" fill="none" stroke="..."`，并标注"用户可自行替换为 logo"

---

## 反例（不要这么写）

- 不要写"请生成一张漂亮的 banner"——模型会发散
- 不要写"加一些装饰元素"——会变花哨
- 不要写"用最流行的设计"——风格不可控
- 不要给完整 brand guidelines（"蓝色代表科技、绿色代表生态……"）——banner 撑不下这么多叙事

---

## 验证清单

静态产物过这 5 项：

1. [ ] 文件能直接在浏览器打开看到效果
2. [ ] viewBox 设置正确，等比缩放不模糊
3. [ ] `<title>` 和 `<desc>` 有意义（不是 "banner" "image" 这种空话）
4. [ ] 在 GitHub dark / light 两种主题下预览都清晰
5. [ ] svgo 压缩后 < 6KB

动效产物额外过这 5 项（详见 `references/motion.md` §7）：

6. [ ] 用安全配置 svgo 压缩后，`prefers-reduced-motion` 与 `role="img"` 仍在
7. [ ] 每个动画元素在元素属性上有静态基线 opacity / stroke-opacity
8. [ ] `prefers-reduced-motion` 里的选择器与实际类名逐字一致
9. [ ] 确定性定帧 + 像素差分，差分像素 > 0
10. [ ] 同一探针跑静态图，差分像素 = 0
