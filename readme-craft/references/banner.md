# README Banner 生成规范（Step 4.5 配套）

> 何时读：Step 4.5 决定生成 banner 后，按本文件产出图。
> 本文件自包含（readme-craft 独立安装时也能用）；要多候选对比、图像 AI 深度调参，改用 `readme-banner` 技能（如已安装）。

---

## 两条路径

| 路径 | 前提 | 产物 | 何时用 |
| --- | --- | --- | --- |
| A：手写 SVG | 无（能写文本文件就行） | `assets/banner.svg` | **默认**。矢量、体积小、可二次编辑 |
| B：生图工具出图 | 环境里有"文字 → 图片"的生成工具 | `assets/banner.png` | 用户主动要求位图 / 复杂视觉时 |

B 路径注意：图内**绝不放文字**（生图模型必写错字），项目名靠 README 的 H1 承担；出 4:1 横图（1280×320 或 1500×500）；PNG 压到 500KB 以内再嵌入。

---

## 画布与文件

- SVG：`viewBox="0 0 1280 320"`（4:1，GitHub 渲染最稳的比例）
- 输出：`<project-root>/assets/banner.svg`，**最终 < 6KB**
- 所有语言版本**共用这一张**

---

## 图内放什么（语言中立原则）

| 元素 | 默认 | 说明 |
| --- | --- | --- |
| 项目名 | 必放 | 来自 manifest `name`，不翻译 |
| 技术栈标签 | 可选，≤ 3 个 | 小字平铺，不做花哨 chip |
| tagline | 多语言项目**不放** | tagline 归各语言 README 的文字层；单语言项目可进图 |
| 装饰符号 | 恰好 1 个 | 空心圆 / 线条 / 同心圆 / 极简坐标轴，按项目气质选 |

总视觉元素 ≤ 4；禁 emoji、拟物图标、复杂插画。

---

## 风格映射（按 Step 4 项目类型）

| 项目类型 | 风格 | 配色 |
| --- | --- | --- |
| library / CLI / API | 暗色科技（**默认**） | bg `#0d1117` / 主文字 `#f0f6fc` / 副文字 `#8b949e` / 强调 `#58a6ff` |
| web-app / 产品 | 渐变彩色 | 2 色渐变 + 白字 `#ffffff` |
| tutorial / docs | 极简白底 | bg `#ffffff` / 文字 `#1f2328` / 强调 `#0969da`，**必须加 1px `#d0d7de` 描边矩形**（亮色主题下图边缘会消失） |

默认暗色科技的理由：深色块在 GitHub 亮 / 暗两种主题下都清晰成立，无需双主题适配。

渐变组合（最多 2 色，禁彩虹）：`#0d1117 → #1f6feb`、`#1a0033 → #7c3aed`、`#0a1929 → #06b6d4`

---

## 布局（二选一）

1. **左对齐**（默认）：项目名距左 80px、垂直 1/3 处，技术栈标签在其下方；右侧 1/3 放装饰符号
2. **居中**：项目名水平居中，技术栈一行居中其下；适合 profile / 强调专业感的项目

字号：主标题 56-72px / `font-weight: 700`；技术栈 14-16px / `500`；中文标题 × 1.1（64-80px，同视觉大小中文要更大）。

字体：系统无衬线栈，**不嵌字体**（文件会爆）：

```
font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
```

---

## GitHub 渲染硬约束（违反任何一条 = 重写）

- ❌ `<foreignObject>`（GitHub strip，整图消失）
- ❌ `xlink:href` / 外部资源引用 / `<image>` 嵌 base64
- ❌ CSS 变量 `var(--x)`（不解析，颜色 fallback 成黑）
- ❌ filter / 动画 / 复杂效果；渐变 ≤ 3 色标且 inline 写在 `<defs>` 里
- ✅ 只用 `text` / `rect` / `circle` / `line` / `path` / `g` / `defs` / `linearGradient` / `radialGradient`
- ✅ 根元素带 `role="img"`；`<title>`（相当于 alt 文本）和 `<desc>` 必填且有意义
- ✅ 用绝对坐标定位，不做 transform-origin 相对计算

---

## 生成流程（路径 A）

1. 用 Write 工具一次写出 `assets/banner.svg`（默认只出一张，不搞候选让用户等）
2. 静态自检（环境里有浏览器 / 截图能力就再渲染看一眼，没有以上面的检查为准）：
   - XML 能解析：标签闭合、属性带引号、无禁用元素
   - `viewBox="0 0 1280 320"` 正确
   - `<title>` / `<desc>` 写的是"项目名 — 一句话说明"，不是 `"banner"`、`"image"` 这种空话
   - 文件 < 6KB（超了先删装饰符号和角标再重写）
3. 可选压缩：`npx svgo assets/banner.svg -o assets/banner.svg`（没有 node / 离线就跳过——手写 SVG 本来就小）

---

## 嵌入（两种路径相同，B 把 `src` 换成 `./assets/banner.png`）

```markdown
<div align="center">
  <img src="./assets/banner.svg" alt="{{PROJECT_NAME}}" width="100%">
</div>
```

---

## 反例（一眼廉价的那种）

- 彩虹渐变 + 玻璃拟态 + 光效 + 阴影（生图模型的默认审美）
- 把 star 数、slogan、仓库 URL 全塞进图
- 纯白底不加描边（GitHub 亮色主题下边界消失）
- > 50KB 的 SVG（GitHub 渲染卡顿）

> 检验标准：把 banner 缩到 200px 宽，还能看清项目名，且不显廉价。
