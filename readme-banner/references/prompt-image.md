# 版本 B：图像生成 AI 出图

适合 **Midjourney v7 / DALL-E 3 / Stable Diffusion XL / Flux**。
输出是位图（PNG），需要再用 [vtracer](https://github.com/visioncortex/vtracer) 或
[SVGcode](https://svgco.de/) 矢量化才能用。

---

## 主模板

```text
Design a minimal, professional GitHub README header banner for an open source project.

Project name: {{PROJECT_NAME}}
Tagline: {{TAGLINE}}
Tech stack (small text, optional): {{TECH_STACK}}

Visual requirements:
- Aspect ratio: 4:1 (1280x320 or 1500x500)
- Background style: {{STYLE}}
  - minimal-light: pure white (#ffffff) or off-white (#f6f8fa), no patterns
  - dark-tech: deep dark (#0d1117) or subtle dark gradient (max 2 colors)
  - gradient-colorful: smooth linear gradient, 2 colors max, dark to accent
- Typography: clean sans-serif, bold project name on the left, smaller tagline below
- One subtle geometric accent on the right side (a single circle, line, or abstract shape)
- Text color: high contrast against background
  - light bg: dark text (#1f2328)
  - dark bg: light text (#f0f6fc)
  - gradient: white text (#ffffff)

Strict constraints:
- NO emoji, NO mascots, NO illustrations of people or characters
- NO glassmorphism, NO 3D, NO neumorphism
- NO busy patterns, NO complex light effects, NO reflections
- NO text in the image — typography will be added separately
- Empty space is important — keep it clean and breathing
- No watermark

Output: PNG, 1280x320, no watermark
```

---

## 底图 + 动效层（形态组合 = 全动态 或 混合中的动态位）

图像 AI 出的是**位图**，本身不会动。做法是：**AI 只出无文字底图，SVG 动效层叠在上面**。

### 流程

1. **AI 出底图**——用主模板，但必须确认输出**完全无文字**（见下方「底图专属约束」）。
2. **准备动效层**——读 `references/motion.md`，按里面的元素分工与 keyframes 模板手写 SVG 装饰层。
3. **合成**——把底图 PNG 以 base64 data URI 内嵌进 SVG 的 `<image>`，再叠动效层：

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" role="img">
  <title>{{PROJECT_NAME}} — {{TAGLINE}}</title>
  <desc>...</desc>
  <style>
    /* 动效层的 keyframes 与 animation 声明 */
  </style>
  <image href="data:image/png;base64,{{BASE64}}" x="0" y="0" width="1280" height="320"/>
  <!-- 动效装饰层叠在底图之上 -->
  <g class="an-brk">...</g>
</svg>
```

4. **文字**——文字仍由 SVG `<text>` 写，**不要**让 AI 画进底图。
5. **验证**——走 `references/motion.md` §7 的三关验证。

### 底图专属约束

追加到主模板的约束里：

```text
- NO text, NO letters, NO words, NO numbers anywhere in the image
- Keep the LEFT or CENTER 55% of the canvas visually quiet — simple flat background only
  (typography and the animated overlay layer will be added on top)
- The image must be compressible: prefer flat large color areas over gradients and fine noise
- Output PNG or JPEG, 1280x320
```

> 为什么强调「安静区域」：动效层与文字要叠在底图上，底图太花会盖住文字，也难以用 base64 压到小体积。

### 体积口径

base64 会让位图膨胀约 33%，且位图底图无法像矢量那样压到 6KB。

⇒ **B 路径的动效产物走 <50KB 的宽松线**（与本文件既有的矢量化产物线一致），不要拿 6KB 去卡它。

### 合成时的 base64 编码

```bash
# macOS / Linux
base64 -i banner-bg.png | tr -d '\n' > banner-bg.b64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('banner-bg.png')) | Set-Content -Path banner-bg.b64 -Encoding ascii
```

把内容插进 `<image href="data:image/png;base64,...">`。

---

## 各平台调参

### Midjourney v7

主模板后面加：

```text
--ar 4:1 --style raw --no text,emoji,character,mascot,illustration --s 50 --q 2
```

**关键参数**：
- `--style raw` 关掉 MJ 默认的美化滤镜，让输出更接近你的描述
- `--s 50` 降低风格化强度（默认 100 太花）
- `--no text` 显式排除文字（MJ 的字经常写错）

### DALL-E 3

主模板开头加：

```text
This is for a software project README. The image will be used as a website header.
There must be NO text, NO letters, NO words anywhere in the image. I will add typography separately in post-processing.
The image must be safe for work and look professional in a developer context.
```

DALL-E 3 对"无文字"指令很敏感，必须反复强调。

### Stable Diffusion XL + Logo LoRA

主模板改写为 SDXL 兼容格式：

```text
(masterpiece, best quality), minimal GitHub banner, 4:1 aspect ratio,
dark background, single geometric shape accent,
abstract minimalist design, high contrast,
(masterpiece, best quality:1.2), (clean:1.3), (minimal:1.4)

Negative prompt: text, watermark, signature, busy, cluttered, character, person,
gradient mesh, 3d render, glass, reflection, neon
```

**推荐 LoRA**：
- `Logo-Redmond` — 扁平 logo 风
- `Flat-Icon-SDXL` — 平面图标风
- `Vector-Art-Diffusion` — 矢量感

**关键参数**：
- Sampler: DPM++ 2M Karras
- Steps: 30-40
- CFG: 7-9
- Resolution: 1280x320（SDXL 需先出 1024x1024 再裁切，或用 SDXL 专门的 wide model）

### Flux（在线 / Replicate）

主模板可直接用，Flux 对英文 prompt 理解力强，无需额外调参。

---

## 多变体（用于 A+B 模式）

如果用户选了「A+B 都要各出 3 张」，在主模板后追加：

```text
Generate 3 different compositional variants:
- Variant 1: Left-aligned text composition with empty right side
- Variant 2: Centered composition with symmetric geometry
- Variant 3: Asymmetric composition with diagonal or scattered elements

For each variant, output the image separately.
```

---

## 位图转 SVG（矢量化）

拿到满意的 PNG 后，**不要直接用 PNG 当 README banner**——会卡 GitHub 加载。
转 SVG：

### 方式 1：vtracer（推荐，本地）

```bash
# 安装
cargo install vtracer
# 或 macOS: brew install vtracer

# 使用
vtracer --input banner.png --output banner.svg \
  --colormode color --hierarchical stacked \
  --mode polygon --filter_speckle 4 --corner_threshold 60
```

### 方式 2：SVGcode（在线）

打开 <https://svgco.de/>，拖入 PNG，自动矢量化，下载 SVG。

### 方式 3：Inkscape（GUI 兜底）

文件 → 打开 PNG → 路径 → 描摹位图 → 选「彩色」/「灰度」→ 应用 → 导出为 SVG。

---

## 矢量化后必须做

1. **手动检查**：把转出来的 SVG 用浏览器打开，看是否丢失了重要细节
2. **用 svgo 压一遍**：
   ```bash
   npx svgo banner.svg -o banner.min.svg
   ```
3. **删多余的 metadata**：vtracer 会带很多无用属性
4. **添加 `<title>` 和 `<desc>`**：转出来的 SVG 默认没有
5. **加 `role="img"`**

> ⚠️ 若产物带动画，**不要用 svgo 默认配置**——它会静默丢掉 `@media (prefers-reduced-motion)` 和 `role="img"`。改用 `references/motion.md` §6 的安全配置。

---

## 验证清单

静态产物：

- [ ] PNG 在 dark/light 主题下都看得清
- [ ] 没有 AI 写错的字（如果出现就是失败）
- [ ] 没有变形 / 伪影
- [ ] 矢量化后 SVG < 50KB（GitHub 渲染阈值）
- [ ] 加完 `<title>` 和 `<desc>` 之后 GitHub 抓取正常

底图 + 动效层产物额外要求：

- [ ] 底图**完全没有文字**
- [ ] 文字由 SVG `<text>` 写，位置不与底图亮区打架
- [ ] base64 内嵌后总体积 < 50KB
- [ ] 动效层元素在文字区域之外（不要压住文字）
- [ ] 压缩后 `prefers-reduced-motion` 与 `role="img"` 仍在
- [ ] 确定性定帧 + 像素差分，差分像素 > 0
- [ ] 静态对照差分 = 0
