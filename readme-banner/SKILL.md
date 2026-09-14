---
name: readme-banner
description: |
  给 GitHub README / 个人 profile 生成 banner / hero 图。支持两种生成路径：
  A) LLM 直接写干净的 SVG 代码（体积小、可二次编辑、首选）；
  B) 图像生成 AI（Midjourney / DALL-E / SDXL）出位图再矢量化。
  也可两种都出 3-4 张候选让用户挑。
  触发词：「生成 README banner」「做个项目 banner」「README 顶部图」「SVG banner」「hero 图」
  不要在以下场景使用：
  - 只是要小 logo / favicon → 改用专门的 logo skill
  - 已经在用 readme-craft 写 README 正文 → 在 readme-craft 内部一并处理即可（readme-craft Step 4.5 会默认生成一张 SVG banner；本 skill 用于独立出图、多候选对比或图像 AI 路径）
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

按需问，**用 `ask_user` 一次问完**（最多 3 个问题合并成一个 questionnaire）：

- **项目名**（必填，从 manifest 推断时跳过）
- **一句话 tagline**（必填）
- **副标题 / 详情**（可选）
- **技术栈标签**（可选，逗号分隔）
- **风格偏好**（3 选 1）：
  - 极简白底（适合文档、工具类）
  - 暗色科技（适合 SDK、CLI、库）
  - 渐变彩色（适合产品 / Web 应用）
- **生成方式**（3 选 1）：
  - A：LLM 写 SVG（推荐，体积小、可编辑）
  - B：图像 AI 出图（适合复杂视觉 / 光影）
  - A+B 都要，各出 3 张候选（适合对结果不确定时）

> 不要在 prompt 里塞无关信息：项目类型、目标用户、商业模式这些是 README 正文该写的，banner 只需要「项目名 + tagline + 风格」三件套。

---

## Procedure

### Step 0 — 选择生成方式

**必须**用 `ask_user` 让用户选 A / B / A+B。这是核心决策，不能猜。

如果用户没主动说明，按 `ask_user` 流程走；用户明确说「随便」「你看着办」时，默认 **A（LLM 写 SVG）**——这是 90% 场景下的最佳起点。

### Step 1 — 收集项目信息

按上面 Inputs 的字段收集。如果用户在当前目录运行，**优先**从项目 manifest（`package.json` / `pyproject.toml` / `pom.xml` / `Cargo.toml` 等）自动提取项目名和 tagline，不要手动问。

git 元信息（用命令读，不修改）：
```bash
git remote get-url origin   # 提取 <user>/<repo> 用于角落小字
```

### Step 2 — 调用对应 prompt 模板

根据 Step 0 的选择：

| 选 A | 选 B | 选 A+B |
|---|---|---|
| 读 `references/prompt-svg.md`，按模板填入项目信息，让 LLM 写 SVG | 读 `references/prompt-image.md`，按模板填入项目信息，喂给图像 AI | 两个 prompt 都跑，每个让模型出 3 个变体 |

**A+B 模式的工作流**：
1. 告诉 LLM：「请按版本 A prompt 生成 3 个不同构图的 SVG 变体」
2. 告诉图像 AI：「请按版本 B prompt 生成 3 个不同构图的候选图」
3. 把 6 个候选的预览 / 描述列给用户，让他挑一个最满意的

### Step 3 — 后处理

拿到 SVG 后**必须**做：

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
- SVG 文件如果超过 50KB，GitHub 不会 strip 但渲染会卡顿。务必压到 6KB 以下。
- 暗色科技风格在某些浅色 GitHub 主题（如 `colorblind`）下可能对比度不足，必要时用两组配色。
