---
name: readme-banner
description: |
  给 GitHub README / 个人 profile 生成 banner / hero 图。支持三种生成路径：
  A) LLM 直接写干净的 SVG 代码（体积小、可二次编辑、首选）；
  B) 图像生成 AI（Midjourney / DALL-E / SDXL）出位图再矢量化；
  C) B 的底图叠加 SVG 动效层。
  产物分静态与带 CSS 动画两种形态，每次生成前先问清数量与形态。
  触发词：「生成 README banner」「做个项目 banner」「README 顶部图」「SVG banner」「hero 图」「生成动态 banner」「会动的 banner」「带动画的 README 顶部图」
  不要在以下场景使用：
  - 只是要小 logo / favicon → 改用专门的 logo skill
  - 已经在用 readme-craft 写 README 正文 → 在 readme-craft 内部一并处理即可（readme-craft Step 4.5 会默认生成一张 SVG banner；本 skill 用于独立出图、多候选对比、动效版本或图像 AI 路径）
  - 已有现成 banner，只想优化或转格式 → 改用 svgo / vtracer 工具直接处理
risk: safe
source: "self-authored"
---

# readme-banner

为 GitHub 项目的 README 顶部（或个人 profile）生成一张 hero / banner 图，输出可直接嵌入 markdown 的 SVG 或 PNG。

## 设计原则

- **极简优先**：banner 是 README 的"门面"，但不是主角。3 个视觉元素以内最稳（标题 / 副标题 / 一个点睛符号）。
- **可缩放**：默认输出 SVG 矢量图，文件 < 6KB，渲染清晰。
- **支持 dark/light 双主题**：配色用 GitHub 调色板变量，颜色选两组相近的深色 / 浅色。
- **无障碍**：必须加 `<title>` 和 `<desc>`，文字用系统字体栈。

## Inputs to collect

按需问，**用 `ask_user` 一次问完**（最多 4 个问题合并成一个 questionnaire）：

- **项目名**（必填，从 manifest 推断时跳过）
- **一句话 tagline**（必填）
- **副标题 / 详情**（可选）
- **技术栈标签**（可选，逗号分隔）
- **风格偏好**（3 选 1）：
  - 极简白底（适合文档、工具类）
  - 暗色科技（适合 SDK、CLI、库）
  - 渐变彩色（适合产品 / Web 应用）

> 不要在 prompt 里塞无关信息：项目类型、目标用户、商业模式这些是 README 正文该写的，banner 只需要「项目名 + tagline + 风格」三件套。

---

## Step 0 — 生成前问卷（必做）

**必须**用一次 `ask_user` 问完下面三件事，不要拆成多轮，也不要替用户假设。

### 问题 1｜生成几张

- 1 张
- 3 张
- 6 张

### 问题 2｜形态组合

- **全静态** — 所有候选都不带动画
- **全动态** — 所有候选都带动画
- **混合** — 候选之间混合静态与动态（默认项）

### 问题 3｜生成方式

- A：LLM 写 SVG（推荐，体积小、可编辑）
- B：图像 AI 出图（适合复杂视觉 / 光影）
- A+B 都要，各出候选（适合对结果不确定时）

> 用户主动说了数量或形态时（如「出 3 张，要动效」），**跳过对应问题**，不要重复问。
> 用户明确说「随便」「你看着办」时，默认 **A 路径 / 3 张 / 混合**。

### 形态组合的分配规则

| 组合 | 分配 |
|---|---|
| 全静态 | 全部候选不带动画 |
| 全动态 | 全部候选带动画 |
| 混合 | **对位交替**：第 1、3、5 张静态，第 2、4、6 张动态 |

**混合模式下每张候选都是独立构图**，静态版与动态版不重复使用同一构图——混合的目的是横向对比两种风格路线，不是同一张图出两个版本。

数量为奇数时以静态起始、静态收尾（1 张 → 静态；3 张 → 静/动/静；6 张 → 静/动/静/动/静/动）。

---

## Procedure

### Step 1 — 收集项目信息

按上面 Inputs 的字段收集。如果用户在当前目录运行，**优先**从项目 manifest（`package.json` / `pyproject.toml` / `pom.xml` / `Cargo.toml` 等）自动提取项目名和 tagline，不要手动问。

git 元信息（用命令读，不修改）：
```bash
git remote get-url origin   # 提取 <user>/<repo> 用于角落小字
```

### Step 2 — 调用对应 prompt 模板

根据 Step 0 的「生成方式」选择 prompt 模板，根据「形态组合」决定产出静态版还是动效版。

| 生成方式 | 形态 | 做法 |
|---|---|---|
| A | 静态 | 读 `references/prompt-svg.md` 主模板 |
| A | 动态 | 读 `references/prompt-svg.md` **动效变体**段 + `references/motion.md` |
| B | 静态 | 读 `references/prompt-image.md` 主模板 |
| B | 动态 | 读 `references/prompt-image.md` **底图 + 动效层**段 + `references/motion.md` |
| A+B | 按各自形态 | 两个 prompt 都跑，每个出对应数量的候选 |

**动效产物一律先读 `references/motion.md`**，那里面有元素分工、keyframes 模板、硬性要求与验证方法。

**混合模式下的 A+B**：每个候选按对位交替规则决定形态——奇数位走静态 prompt，偶数位走动效 prompt。

**多候选的构图要求**：每张候选换一个构图（左侧文字 / 居中 / 分栏等），不要出多张只有颜色不同的同一张图。

### Step 3 — 后处理

#### 静态产物

1. **用 SVGO 压一遍**（如果环境里有）：
   ```bash
   npx svgo banner.svg -o banner.min.svg
   ```
   或在线：<https://jakearchibald.github.io/svgomg/>

2. **检查无障碍标签**：确认 `<title>` 和 `<desc>` 元素存在且有意义。

3. **dark / light 主题双测**：分别在 GitHub dark 和 light 模式下打开预览图，确认配色都看得清。

4. **GitHub 渲染注意**：
   - 不要用 `<foreignObject>`（GitHub 会 strip）
   - 不要用 `xlink:href` 外部引用
   - 不要用 CSS 变量（GitHub markdown 渲染器不解析）
   - 渐变定义必须 inline 在 `<defs>` 里

#### 动效产物

静态产物的 1–4 条全部适用，另加**三关验证**（缺一不可，细节见 `references/motion.md`）：

1. **压缩用安全配置**——默认 svgo 会静默丢掉 `@media (prefers-reduced-motion)` 和 `role="img"`。必须用 `references/motion.md` §6 的 `svgo.config.mjs`。
2. **压缩后必检**：`grep -c 'prefers-reduced-motion'` 与 `grep -c 'role="img"'` 均须 ≥ 1。
3. **动效确实在动**：用 `references/motion.md` §7 的「确定性定帧 + 像素差分」，差分像素须 > 0。
4. **静态对照**：同一探针跑静态图，差分须为 0。

环境没有 Chrome 时，如实报告「动效未能实机验证」，不要声称验证通过。

### Step 4 — 嵌入 README

```markdown
<p align="center">
  <img src="./banner.svg" alt="{{PROJECT_NAME}} — {{TAGLINE}}" width="100%">
</p>
```

把 `alt` 写清楚是项目名 + tagline 的组合，对屏幕阅读器友好。

---

## 风格参考

**推荐阅读 `references/design-spec.md`**——里面有尺寸、字体、配色、构图的具体规范和反例。

如果你对最终效果没把握，**先小后大**：先用 A 模式快速出一个最小版本，确认调性对了再迭代，不要一上来就堆细节。

---

## 已知限制

- 图像 AI（版本 B）出的 logo **文字经常写错**（"README" 拼成 "READNE"）。规避办法：让 AI 只出图形部分，文字后期用 LLM 写 SVG 覆盖。
- SVG 文件如果超过 50KB，GitHub 不会 strip 但渲染会卡顿。纯矢量产物务必压到 6KB 以下。
- 暗色科技风格在某些浅色 GitHub 主题（如 `colorblind`）下可能对比度不足，必要时用两组配色。
- 动效依赖浏览器播放 CSS 动画。GitHub README 会播（只清 `<script>`，保留 `<style>` 与 keyframes），但部分邮件客户端与镜像站不播——所以动效产物的**首帧必须是完整可用的 banner**，不能只有动画才有内容。
- B 路径的动效产物（底图 base64 内嵌）体积天然偏大，走 <50KB 的宽松线，不适用 6KB 目标。
