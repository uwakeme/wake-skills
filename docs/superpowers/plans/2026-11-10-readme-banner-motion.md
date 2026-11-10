# readme-banner 动效支持 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `readme-banner` 技能能产出带 CSS 动画的 banner，并在每次生成前用问卷问清「生成几张」和「静态/动态/混合」。

**Architecture:** 技能主体仍是 SKILL.md + references/ 的纯文本形态，无运行时依赖。新增 `references/motion.md` 承载动效专项（keyframes 模板、svgo 安全配置、无头验证方法）；SKILL.md 的 Step 0 换成三问问卷，Step 2 按形态分流到静态/动效两条产出路径。所有动效产物统一走「压缩 → 三关验证」的收尾流程。

**Tech Stack:** 纯 Markdown 技能文件；`npx svgo@4`（仅压缩动效产物时用）；Chrome 无头（仅验证动效时用）；Node 22 内置 `node --test`。

## Global Constraints

- 仓库零运行时依赖：不新增 `package.json` 的 `dependencies`，不引入 npm 包进仓库。`npx svgo` 与 Chrome 是**用户机器上的可选工具**，用不到就跳过，不得写进仓库依赖。
- 动效交付格式只有一种：**SVG + CSS 动画**。不产出 GIF / WebP / APNG。
- GitHub README 约束（写入每个动效 prompt 的硬性禁止项）：不用 `<foreignObject>`、不用 `xlink:href`、不用外部资源引用、不用 CSS 变量 `var(--...)`、不用 `<script>`。
- 动效产物的三条硬性要求：① 首帧即完整可用（每个动画元素在**元素属性**上写静态基线 `opacity` / `stroke-opacity`）；② `@media (prefers-reduced-motion: reduce)` 的选择器必须指向**真实存在的类名**；③ CSS `transform` 放外层 `<g>`，SVG `transform` 属性放内层元素。
- 字体栈必须含中文回退：`'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC'`。
- 体积口径：纯矢量动效产物 < 6KB；B 路径（底图 base64 内嵌）动效产物 < 50KB。
- 文字只做**一次性入场**（淡入 + 8px 上移，0.6s），**不做持续循环**；持续循环只允许用在装饰层。
- 风格母题：文字居中排版、**不要圆圈图案**、装饰用直线型元素（斜向光带、扫描线、斜纹、直角括号）。
- 提交前必须 `npm run build` + `npm run check` + `npm test`；`npm run check` 有漂移时退出码 1。
- Windows 环境：`node --test test/` 在本机不可用，一律用 `npm test`（内部走 `node --test "test/*.test.mjs"`）。
- 提交直接落在 `main`，不开特性分支；**只 `git add` 本次涉及的文件**，绝不 `git add -A` / `git add .`。
- 版本号是行为契约：`marketplace.json` 与 `plugin.json` 两处都要改，版本从 `0.1.0` 升到 `0.2.0`。

---

## 文件结构

| 文件 | 动作 | 职责 |
|---|---|---|
| `readme-banner/SKILL.md` | 改 | 主体流程：Step 0 三问问卷、Step 2 形态分流、Step 3 三关验证 |
| `readme-banner/references/motion.md` | 新建 | 动效专项：元素分工、keyframes 模板、svgo 安全配置、无头验证方法、GitHub 约束、常见错法 |
| `readme-banner/references/prompt-svg.md` | 改 | A 路径 prompt：新增「动效变体」模板段 |
| `readme-banner/references/prompt-image.md` | 改 | B 路径 prompt：新增「底图 + 动效层」组合段与体积口径 |
| `readme-banner/references/design-spec.md` | 改 | 设计规范：新增「动效规范」一节 |
| `readme-banner/.claude-plugin/plugin.json` | 改 | 版本 0.1.0 → 0.2.0，描述补动效能力 |
| `.claude-plugin/marketplace.json` | 改 | 版本 0.1.0 → 0.2.0，中英描述补动效能力 |
| `README.md` | 改（手写段） | readme-banner 段落的手写描述同步；版本号与触发词行由 build 生成 |
| `CHANGELOG.md` | 改 | `## [Unreleased]` 下记 Changed 条目 |

---

## Task 1: 新建 `references/motion.md` —— 动效专项规范

**Files:**
- Create: `readme-banner/references/motion.md`

**Interfaces:**
- Consumes: 无（独立新建，可先做）
- Produces: 后续 Task 2/3/4 引用的规范来源——动效 prompt 片段、svgo 安全配置、验证命令

- [ ] **Step 1: 写 `readme-banner/references/motion.md`**

完整内容如下（创建文件，一次写完）：

````markdown
# 动效规范

> 何时读：产出**带动画**的 banner 时必读。纯静态产物不用这个文件。
> 这份文件自包含——readme-craft 独立安装时也能用。

---

## 1. 交付格式：只有 SVG + CSS 动画

GitHub 渲染 README 里的 `<img src="x.svg">` 时，只清洗 `<script>` 和事件处理器，**`<style>` 与 `@keyframes` 会保留并真的播放**。

⇒ 动效一律用 SVG + CSS 动画交付。**不要**转 GIF / WebP / APNG 帧序列：体积通常几百 KB、不可编辑、还得保证帧间一致。

---

## 2. 元素分工

| 层 | 是否动 | 做法 |
|---|---|---|
| 装饰层（光带、括号、细线、扫描条） | 动 | 持续循环，周期 5–30s，各元素错峰 delay |
| 文字（标题 / 副标题 / 角标） | **只入场** | 一次性：淡入 + 8px 上移，0.6s，ease-out |
| 背景 | 不动 | — |

**文字不做持续循环**——持续动会抢注意力，也干扰阅读。

**风格母题**（与仓库视觉口径一致）：
- 文字**居中**排版
- **不要圆圈图案**（同心环、圆形装饰都不要）
- 装饰母题用**直线型**元素：斜向光带、扫描线、斜纹、直角括号

---

## 3. 三条硬性要求

### 3.1 首帧即完整可用

不播动画的阅读器（GitHub 移动端、邮件客户端、部分镜像站）看到的必须是完整 banner。

做法：每个动画元素**同时在元素属性上**写静态基线，不依赖 CSS 才可见。

```xml
<!-- 对：属性里有基线 opacity -->
<path class="an-brk" d="M40 78 V40 H78" opacity=".5"/>

<!-- 错：只在 CSS 里给 opacity -->
<path class="an-brk" d="M40 78 V40 H78"/>
```

### 3.2 降级规则必须能命中

```css
/* 对：选择器指向真实存在的类 */
@media (prefers-reduced-motion: reduce){
  .an-brk, .an-rule { animation: none !important; }
}
```

**反面教材**（真实踩过的坑）：写 `.an{animation:none}`，但元素实际类名是 `.an-b1` / `.an-b2` / `.an-rule` / `.an-brk` —— 选择器匹配不到任何元素，降级规则**从未生效**，而且从外观上完全看不出来。

⇒ 写完降级规则，**逐个核对类名与选择器是否一致**。

### 3.3 CSS transform 与 SVG transform 属性分离

CSS 的 `transform` 会**覆盖**同名的 SVG `transform` 属性。

```xml
<!-- 对：位移在外层 g（CSS），旋转在内层 rect（属性），两者复合 -->
<g class="an-band"><rect x="-260" y="52" width="980" height="104" fill="url(#g1)" transform="rotate(-15 640 160)"/></g>
```

```css
.an-band { animation: band 26s ease-in-out infinite; }
@keyframes band { 0%,100% { transform: translateX(-64px); } 50% { transform: translateX(64px); } }
```

---

## 4. 可复制的 keyframes 模板

```css
<style>
  /* 斜向柔光带漂移——最常用的装饰动效 */
  .an-b1 { animation: m-b1 26s ease-in-out infinite; }
  .an-b2 { animation: m-b2 34s ease-in-out infinite; }
  /* 细线呼吸 */
  .an-rule { animation: m-rule 5s ease-in-out infinite; }
  /* 直角括号呼吸 */
  .an-brk { animation: m-brk 7s ease-in-out infinite; }
  /* 错峰 delay：避免所有元素同步动作 */
  .d2 { animation-delay: .7s; } .d3 { animation-delay: 1.4s; } .d4 { animation-delay: 2.1s; }

  @keyframes m-b1 { 0%,100% { transform: translateX(-64px); } 50% { transform: translateX(64px); } }
  @keyframes m-b2 { 0%,100% { transform: translateX(64px); } 50% { transform: translateX(-64px); } }
  @keyframes m-rule { 0%,100% { opacity:.4; } 50% { opacity:1; } }
  @keyframes m-brk { 0%,100% { opacity:.28; } 50% { opacity:.8; } }

  /* 文字一次性入场——只跑一次，不循环 */
  .an-title { animation: m-title .6s ease-out both; }
  .an-sub { animation: m-sub .6s ease-out .15s both; }
  @keyframes m-title { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
  @keyframes m-sub { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

  /* 降级——类名必须与上面完全一致 */
  @media (prefers-reduced-motion: reduce){
    .an-b1,.an-b2,.an-rule,.an-brk,.an-title,.an-sub { animation: none !important; }
  }
</style>
```

**参数口径**：

| 项 | 取值 |
|---|---|
| 装饰层周期 | 5–30s（越慢越不干扰；推荐 20s 以上） |
| 缓动 | `ease-in-out`（装饰层）/ `ease-out`（文字入场） |
| 位移幅度 | ±64px 以内，别超过画布 1/8 |
| 文字入场 | 0.6s，位移 8px，opacity 0 → 1，`both` 保留终态 |
| 同屏动画元素 | ≤ 4 个 |
| 错峰 delay | 0.7s / 1.4s / 2.1s 递增 |

---

## 5. GitHub 渲染硬约束

| 禁止 | 原因 |
|---|---|
| `<script>` / 事件处理器 | GitHub 会清洗 |
| `<foreignObject>` | 整个 SVG 不渲染 |
| `xlink:href` / 外部资源引用 | 资源加载失败，图变空白 |
| CSS 变量 `var(--...)` | GitHub 不解析，颜色回退成黑 |
| `<image>` 嵌外部 PNG | 同上；只允许 base64 data URI |
| `<script>` 之外的 JS 运行时逻辑 | 无执行环境 |

字体栈（必须含中文回退）：

```xml
font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', Roboto, 'Helvetica Neue', Arial, sans-serif"
```

---

## 6. 压缩：必须用安全配置

**`npx svgo` 的默认配置会毁掉动效产物**：

| 现象 | 原因 |
|---|---|
| `@media (prefers-reduced-motion: reduce)` **整块消失** | `inlineStyles` 把类内联成 style 属性后，media 查询里的选择器失效并被清掉 |
| `role="img"` **被删** | `removeUnknownsAndDefaults` 把它当未知属性清理 |

动画本身还活着，但**降级规则与无障碍属性同时静默失效**——压缩后肉眼看不出来。

**安全配置**：写一个 `svgo.config.mjs`，然后 `npx svgo --config svgo.config.mjs`。

```js
// svgo.config.mjs
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          inlineStyles: false,              // 保住 @media 与类选择器
          removeUnknownsAndDefaults: false, // 保住 role="img"
          cleanupIds: false,                // 保住 id / url(#…) 引用
          minifyStyles: false,              // 别改写选择器
        },
      },
    },
  ],
};
```

```bash
npx svgo --config svgo.config.mjs banner.svg -o banner.min.svg
```

压缩后**必检**：

```bash
grep -c 'prefers-reduced-motion' banner.min.svg   # 必须 ≥1
grep -c 'role="img"' banner.min.svg               # 必须 ≥1
```

> `svgo.config.mjs` 是**临时配置文件**，用完删掉，不要提交进仓库。

---

## 7. 验证：动效到底有没有在动

### 7.1 陷阱：不能靠截图时间差判断

`--virtual-time-budget` **不是 CSS 动画的时钟**——同一 SVG 在 120ms / 2600ms / 5000ms 三个预算下截出的是**同一帧**。用它做「隔几秒截两帧比差异」会得到「没动」的假结论。

同样地，**只比 PNG 文件哈希也不可靠**——同一画面在不同编码状态下哈希会变。

正确做法：**确定性定帧 + 像素差分**。

### 7.2 步骤

**第一步：注入暂停 + 负延迟，确定性定帧**

```bash
# 复制一份，注入覆盖规则；负延迟把动画定在指定相位
# 注意 !important：原规则的 animation 简写会把 animation-delay 重置为 0
```

注入到 `</style>` 之前：

```css
.an-b1,.an-b2,.an-rule,.an-brk { animation-play-state: paused !important; animation-delay: -3s !important; }
```

（把选择器换成该产物里**实际存在**的动画类名。）

> **Windows 上不要用内联 PowerShell 拼这类字符串**——嵌套引号与 `$t` 变量会被命令行解析吃掉，直接写成 `.ps1` 脚本文件执行：
>
> ```powershell
> # probe.ps1
> $t = Get-Content 'banner.svg' -Raw
> $sel = '.an-b1,.an-b2'
> function Write-Variant($delay, $out) {
>   $rule = $sel + ' { animation-play-state: paused !important; animation-delay: ' + $delay + 's !important; }'
>   $s = $t.Replace('</style>', $rule + "`n  </style>")
>   [IO.File]::WriteAllText($out, $s, (New-Object Text.UTF8Encoding($false)))
> }
> Write-Variant '0' 'f0.svg'
> Write-Variant '-3' 'f3.svg'
> ```
>
> ```bash
> powershell -NoProfile -ExecutionPolicy Bypass -File probe.ps1
> ```
>
> 用 `[IO.File]::WriteAllText` + `UTF8Encoding($false)` 而不是 `Set-Content -Encoding UTF8`——后者在 PS 5.1 会写 BOM，SVG 带 BOM 可能影响解析。

分别以 `animation-delay: 0s` 和 `animation-delay: -3s` 生成两份，各截一帧。

**第二步：无头截帧**

```bash
chrome --headless=new --disable-gpu --hide-scrollbars \
  --run-all-compositor-stages-before-draw --window-size=1280,320 \
  --virtual-time-budget=500 --screenshot=frame1.png file:///<绝对路径>/f0.svg
```

> `--run-all-compositor-stages-before-draw` **必须带**，否则截出的是固定首帧。
> `file://` 路径要写**绝对路径**并把反斜杠换成正斜杠。

**第三步：像素差分**

用 Chrome 的 canvas 做差分（无需额外依赖）：

```html
<!-- diff.html：把两张截图的 base64 填进 __B1__ / __B2__ -->
<!doctype html><body><script>
const load = (b) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
(async () => {
  const a = await load('__B1__'), c = await load('__B2__');
  const cv = document.createElement('canvas'); cv.width = a.width; cv.height = a.height;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(a, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
  g.clearRect(0, 0, cv.width, cv.height); g.drawImage(c, 0, 0);
  const db = g.getImageData(0, 0, cv.width, cv.height).data;
  let diff = 0, maxd = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.abs(da[i]-db[i]) + Math.abs(da[i+1]-db[i+1]) + Math.abs(da[i+2]-db[i+2]);
    if (d > 6) { diff++; if (d > maxd) maxd = d; }
  }
  document.title = 'DIFF=' + diff + ' MAX=' + maxd;
  document.body.textContent = 'DIFF=' + diff + ' MAX=' + maxd;
})();
</script></body>
```

```bash
chrome --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom file:///<绝对路径>/diff.html
```

### 7.3 判据

| 情况 | 差分像素 | 结论 |
|---|---|---|
| 有动效 | > 0（实测参考量级：480 / 409600 ≈ 0.12%） | 动效真在动 |
| 无动效 | 0 | 静态图 |

### 7.4 静态对照（必做）

同一套探针跑一张**静态** SVG，差分必须是 **0**。

这一步防的是「判定器本身坏了却报通过」。判定器历史上出过错两处（用哈希代替像素差分、拿 virtual-time 当动画时钟），静态对照是常设防线。

### 7.5 环境不具备时

没有 Chrome 或截不了帧时，**如实报告「动效未能实机验证」**，不要声称验证通过。此时至少人工核对：keyframes 语法正确、降级选择器能命中类名、首帧静态基线已写。

---

## 8. 常见错法速查

| 错法 | 后果 |
|---|---|
| 用 svgo 默认配置压缩 | 降级规则与 `role` 静默丢失 |
| `@media` 里写不存在的类名 | 降级从未生效 |
| 只在 CSS 里给 opacity，不写属性基线 | 不播动画的阅读器看到残图 |
| 位移和旋转都写在同一元素 | CSS transform 覆盖 SVG transform 属性，旋转丢失 |
| 文字做持续循环 | 抢注意力、干扰阅读 |
| 用 `--virtual-time-budget` 间隔截帧判断 | 假阴性，误判「没动」 |
| 只比 PNG 哈希 | 假阳性/假阴性，编码一变就误判 |
| 底图 base64 内嵌后还要求 <6KB | 达不到；B 路径动效产物走 <50KB |
````

- [ ] **Step 2: 确认文件写入成功且内容完整**

Run:
```bash
node -e "const fs=require('fs');const t=fs.readFileSync('readme-banner/references/motion.md','utf8');console.log('bytes:',t.length);console.log('sections:',(t.match(/^## /gm)||[]).length);console.log('hasSvgoCfg:',t.includes('removeUnknownsAndDefaults'));console.log('hasVerify:',t.includes('DIFF='));"
```

Expected:
```
bytes: 7000 以上
sections: 8
hasSvgoCfg: true
hasVerify: true
```

（字节数与实际有出入是正常的，只要 >6000、sections 为 8、两个布尔为 true 即可。）

- [ ] **Step 3: 提交**

```bash
git add readme-banner/references/motion.md
git commit -m "feat(readme-banner): 新增动效专项规范 motion.md"
```

---

## Task 2: 改 SKILL.md —— 三问问卷与形态分流

**Files:**
- Modify: `readme-banner/SKILL.md`

**Interfaces:**
- Consumes: Task 1 的 `readme-banner/references/motion.md`
- Produces: Task 3/4 引用的问卷三问（数量 / 形态组合 / 生成方式）与形态分流规则

- [ ] **Step 1: 改 frontmatter 的 description**

把 `readme-banner/SKILL.md` 的 frontmatter `description` 整段替换为（**只替换 `description:` 那段**，`name` / `risk` / `source` 等字段与 `---` 分隔符保持原样）：

```yaml
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
```

> ⚠ 触发词段必须在**第一个句号前**列完所有触发词，否则主页上不显示触发词行。

- [ ] **Step 2: 改「Inputs to collect」段**

把 `## Inputs to collect` 整节替换为：

```markdown
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
```

并在其后新增一节：

```markdown
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
```

- [ ] **Step 3: 改 Step 2 产出路径，加入形态分流**

把 `### Step 2 — 调用对应 prompt 模板` 整节替换为：

```markdown
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
```

- [ ] **Step 4: 改 Step 3 后处理，加入动效专属流程**

把 `### Step 3 — 后处理` 整节替换为：

```markdown
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
```

- [ ] **Step 5: 改「已知限制」段**

把 `## 已知限制` 整节替换为：

```markdown
## 已知限制

- 图像 AI（版本 B）出的 logo **文字经常写错**（"README" 拼成 "READNE"）。规避办法：让 AI 只出图形部分，文字后期用 LLM 写 SVG 覆盖。
- SVG 文件如果超过 50KB，GitHub 不会 strip 但渲染会卡顿。纯矢量产物务必压到 6KB 以下。
- 暗色科技风格在某些浅色 GitHub 主题（如 `colorblind`）下可能对比度不足，必要时用两组配色。
- 动效依赖浏览器播放 CSS 动画。GitHub README 会播（只清 `<script>`，保留 `<style>` 与 keyframes），但部分邮件客户端与镜像站不播——所以动效产物的**首帧必须是完整可用的 banner**，不能只有动画才有内容。
- B 路径的动效产物（底图 base64 内嵌）体积天然偏大，走 <50KB 的宽松线，不适用 6KB 目标。
```

- [ ] **Step 6: 校验触发词能被解析**

Run:
```bash
node -e "import('./scripts/lib/extract.mjs').then(m=>{const fs=require('fs');const t=fs.readFileSync('readme-banner/SKILL.md','utf8');const fm=m.parseFrontmatter(t);const tr=m.extractTriggersFromSkillMd(fm.fields.description);console.log('triggers:',tr.length);console.log(tr.join(' | '));console.log('anti:',m.extractAntiTriggers(fm.fields.description).length);})"
```

Expected: `triggers: 8`，且包含 `生成动态 banner`、`会动的 banner`、`带动画的 README 顶部图`；`anti: 3`。

> 本机已实测：上述 frontmatter 解析出 `triggers: 8 / anti: 3`，与预期一致。

若 `triggers: 0`，说明触发词段里出现了句号——把句号移到所有触发词之后。

- [ ] **Step 7: 提交**

```bash
git add readme-banner/SKILL.md
git commit -m "feat(readme-banner): 生成前三问问卷（数量/形态/方式）+ 动效产出分支"
```

---

## Task 3: 改 `references/prompt-svg.md` —— A 路径动效变体

**Files:**
- Modify: `readme-banner/references/prompt-svg.md`

**Interfaces:**
- Consumes: Task 1 的 `references/motion.md`（keyframes 模板与硬性要求）
- Produces: Task 2 引用的「动效变体」模板段

- [ ] **Step 1: 在 `prompt-svg.md` 的「## 主模板」段之后、「## 多变体」段之前插入动效变体段**

插入以下内容（完整照抄）：

````markdown
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
````

- [ ] **Step 2: 在「## 多变体」段里补一句混合模式提示**

在 `## 多变体（用于 A+B 模式）` 这一节的开头（`如果用户选了「A+B 都要各出 3 张」，在主模板开头加：` 之前）插入一行：

```markdown
> 混合模式下，奇数位候选用静态模板、偶数位候选用动效变体模板——两种模板的构图要各不相同。
```

- [ ] **Step 3: 在「## 验证清单」段补动效项**

把 `## 验证清单` 整节替换为：

```markdown
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
```

- [ ] **Step 4: 提交**

```bash
git add readme-banner/references/prompt-svg.md
git commit -m "feat(readme-banner): prompt-svg 增加动效变体模板与验证清单"
```

---

## Task 4: 改 `references/prompt-image.md` 与 `references/design-spec.md`

**Files:**
- Modify: `readme-banner/references/prompt-image.md`
- Modify: `readme-banner/references/design-spec.md`

**Interfaces:**
- Consumes: Task 1 的 `references/motion.md`
- Produces: Task 2 引用的「底图 + 动效层」组合段与动效规范节

- [ ] **Step 1: 在 `prompt-image.md` 的「## 各平台调参」段之前插入组合段**

插入以下内容（完整照抄）：

````markdown
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
````

- [ ] **Step 2: 改 `prompt-image.md` 的「## 矢量化后必须做」段**

把该节替换为：

```markdown
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
```

- [ ] **Step 3: 改 `prompt-image.md` 的「## 验证清单」段**

把该节替换为：

```markdown
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
```

- [ ] **Step 4: 在 `design-spec.md` 的「## GitHub 渲染的特殊坑」段之后插入动效规范节**

插入以下内容：

````markdown
---

## 动效规范

> 详细的 keyframes 模板、svgo 安全配置、验证方法见 `references/motion.md`。这里只列设计口径。

### 元素分工

| 层 | 是否动 | 做法 |
|---|---|---|
| 装饰层（光带、括号、细线、扫描条） | 动 | 持续循环，周期 5–30s，错峰 delay |
| 文字 | **只入场** | 一次性：淡入 + 8px 上移，0.6s，`ease-out` |
| 背景 | 不动 | — |

文字不做持续循环。

### 风格母题

- 文字**居中**排版
- **禁止圆圈图案**（同心环、圆形装饰都不要）
- 装饰只用**直线型**元素：斜向光带、扫描线、斜纹、直角括号

### 参数口径

| 项 | 取值 |
|---|---|
| 装饰层周期 | 5–30s（推荐 20s 以上） |
| 缓动 | `ease-in-out`（装饰层）/ `ease-out`（文字入场） |
| 位移幅度 | ±64px 以内 |
| 同屏动画元素 | ≤ 4 个 |
| 错峰 delay | 0.7s / 1.4s / 2.1s |

### 三条硬性要求

1. **首帧即完整可用**——每个动画元素在元素属性上写静态基线 `opacity` / `stroke-opacity`。
2. **降级规则必须能命中**——`@media (prefers-reduced-motion: reduce)` 的选择器要指向真实存在的类名。
3. **CSS transform 与 SVG transform 属性分离**——位移放外层 `<g>`（CSS），旋转缩放放内层元素（属性）。

### 体积口径

| 产物类型 | 上限 |
|---|---|
| 纯矢量（静态或动效） | < 6KB |
| B 路径底图 + 动效层（base64 内嵌） | < 50KB |
````

- [ ] **Step 5: 在 `design-spec.md` 的「## 装饰元素：克制清单」段里删掉同心圆**

把该段里的这一行删掉：

```markdown
- 同心圆 / 雷达环（适合 API / 网络相关项目）
```

改为：

```markdown
- ~~同心圆 / 雷达环~~ —— 动效产物一律不用圆圈图案，改用扫描线 / 斜纹
```

- [ ] **Step 6: 提交**

```bash
git add readme-banner/references/prompt-image.md readme-banner/references/design-spec.md
git commit -m "feat(readme-banner): prompt-image 增加底图+动效层段，design-spec 增加动效规范"
```

---

## Task 5: 版本号、注册表、README、CHANGELOG

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Modify: `readme-banner/.claude-plugin/plugin.json`
- Modify: `README.md`（手写描述段）
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 2–4 的全部内容（描述文字要如实反映已实现的能力）
- Produces: 主页与 README 上展示的新版本与新描述

- [ ] **Step 1: 改 `readme-banner/.claude-plugin/plugin.json`**

改为：

```json
{
  "name": "readme-banner",
  "version": "0.2.0",
  "description": "为 GitHub README 生成 header banner / hero 图。三种生成路径：LLM 直接写 SVG、图像 AI 出图再矢量化、图像 AI 底图叠加 SVG 动效层。产物分静态与带 CSS 动画两种形态，生成前先问清数量与形态。",
  "author": { "name": "uwakeme" },
  "license": "MIT",
  "skills": "."
}
```

- [ ] **Step 2: 改 `.claude-plugin/marketplace.json` 里 readme-banner 那条**

把该条目的 `version` 改成 `"0.2.0"`，`description` 改成：

```
"description": "Generate GitHub README header banner. Three paths: let an LLM write clean SVG directly (preferred, small and editable), use image AI (Midjourney / DALL-E / SDXL) and vectorize the output, or layer an SVG animation over an AI-generated base image. Output can be static or carry CSS animation; the skill asks up front how many variants you want and which mix of static and animated.",
```

把 `description_i18n` 改成：

```json
"description_i18n": {
  "en": "Generate GitHub README header banner. Three paths: let an LLM write clean SVG directly (preferred, small and editable), use image AI (Midjourney / DALL-E / SDXL) and vectorize the output, or layer an SVG animation over an AI-generated base image. Output can be static or carry CSS animation; the skill asks up front how many variants you want and which mix of static and animated.",
  "zh-CN": "为 GitHub README 生成顶部 banner / hero 图，支持三条路径：LLM 直接写干净 SVG 代码（首选，轻量可编辑）、图像 AI（Midjourney / DALL-E / SDXL）出位图再矢量化、图像 AI 出底图再叠 SVG 动效层。产物分静态与带 CSS 动画两种形态，生成前先问清要几张、静态动态怎么混。"
}
```

同时把该条目的 `keywords` 补上 `"animation"`：

```json
"keywords": ["readme", "banner", "svg", "design", "animation"]
```

- [ ] **Step 3: 跑 build 并同步 README**

Run:
```bash
npm run build
```

Expected: 打印 `已更新: README.md`（或类似），且列出 `readme-banner v0.2.0`。

> build 会自动改 README 的版本号行与触发词行；**手写描述段落它不碰**，下一步手改。

- [ ] **Step 4: 手改 README 的 readme-banner 描述段**

在 README.md 里找到 `### [readme-banner](./readme-banner)` 那一段，把标题行与「触发词：」行之间的描述段落替换为：

```markdown
为 GitHub README 顶部生成 hero / banner 图。三条生成路径：让 LLM 直接写干净的 SVG 代码（首选，体积小、可二次编辑）、用图像 AI（Midjourney / DALL-E / SDXL）出位图再矢量化、图像 AI 出底图再叠 SVG 动效层。产物分静态与带 CSS 动画两种形态——动效走 SVG 内嵌 `@keyframes`，GitHub README 会真的播，不播的首帧也仍是完整可用的图。生成前用一次问卷问清「生成几张」和「全静态 / 全动态 / 混合」，混合时按对位交替分配候选。带 4 份 reference：`prompt-svg.md` / `prompt-image.md` / `design-spec.md` / `motion.md`（动效专项：keyframes 模板、svgo 安全配置、无头验证方法）。
```

- [ ] **Step 5: 改 CHANGELOG**

在 `CHANGELOG.md` 的 `## [Unreleased]` 段下，`### Changed` 小节的开头插入一条：

```markdown
- **readme-banner 0.2.0**：新增动效产出能力——产物分静态与带 CSS 动画两种形态，动效走 SVG 内嵌 `@keyframes`（GitHub README 实测会播，不播的环境首帧仍是完整可用的图）；生成前用一次问卷问清「生成几张」与「全静态 / 全动态 / 混合」，混合时按对位交替分配候选；图像 AI 路径新增「底图 + 动效层」组合。新增 `references/motion.md` 收录动效规范、svgo 安全配置（默认配置会静默丢掉降级规则与 `role="img"`）与确定性定帧验证方法
```

- [ ] **Step 6: 跑全套校验**

Run:
```bash
npm run build
npm run check
npm test
```

Expected:
- `npm run build` 打印 `6 个 skill：`，其中含 `- readme-banner v0.2.0 [design] 触发来源=skill-md 触发词=8`
- `npm run check` 干净退出（无「漂移」字样，退出码 0）
- `npm test` 全部通过

> 若 `npm run check` 报漂移，跑一次 `npm run build` 再 check。
> 若触发词不是 8，回到 Task 2 Step 6 排查。

- [ ] **Step 7: 提交**

```bash
git add .claude-plugin/marketplace.json readme-banner/.claude-plugin/plugin.json README.md CHANGELOG.md
git commit -m "feat(readme-banner): 0.2.0 动效支持，注册表与 README 同步"
```

> pre-commit hook 会在暂存内容命中 `SKILL.md` / `marketplace.json` 时自动跑 build 并把生成物一并纳入本次提交。本步骤已手动 build 过，hook 再跑一次是无害的。

---

## Task 6: 端到端自测 —— 真的出一张动效 banner

**Files:**
- Create（临时，验证后删除）: `banner-e2e.svg`、`banner-e2e-f0.svg`、`banner-e2e-f3.svg`、`svgo.config.mjs`、`diff.html`
- 不改仓库任何文件

**Interfaces:**
- Consumes: Task 1–5 的全部产出
- Produces: 一次真实的端到端验证结论

> 这一步**不改仓库文件**，只在临时目录里手写一张动效 banner，走完「压缩 → 三关验证」，证明规范里的命令真的能跑通。

- [ ] **Step 1: 手写一张动效 banner 到临时目录**

在仓库根建临时目录 `.tmp-e2e/`（验证后删掉），写 `banner-e2e.svg`：

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" width="1280" height="320" role="img" text-rendering="geometricPrecision" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', Roboto, 'Helvetica Neue', Arial, sans-serif">
  <title>E2E Banner — 动效自测</title>
  <desc>深色底居中排版，两条斜向光带缓慢漂移，四角直角括号呼吸，文字一次性入场。</desc>
  <style>
    .an-b1 { animation: e-b1 26s ease-in-out infinite; }
    .an-b2 { animation: e-b2 34s ease-in-out infinite; }
    .an-rule { animation: e-rule 5s ease-in-out infinite; }
    .an-brk { animation: e-brk 7s ease-in-out infinite; }
    .d2 { animation-delay: .7s; } .d3 { animation-delay: 1.4s; } .d4 { animation-delay: 2.1s; }
    .an-title { animation: e-title .6s ease-out both; }
    .an-sub { animation: e-sub .6s ease-out .15s both; }
    @keyframes e-b1 { 0%,100% { transform: translateX(-64px); } 50% { transform: translateX(64px); } }
    @keyframes e-b2 { 0%,100% { transform: translateX(64px); } 50% { transform: translateX(-64px); } }
    @keyframes e-rule { 0%,100% { opacity:.4; } 50% { opacity:1; } }
    @keyframes e-brk { 0%,100% { opacity:.28; } 50% { opacity:.8; } }
    @keyframes e-title { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
    @keyframes e-sub { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
    @media (prefers-reduced-motion: reduce){
      .an-b1,.an-b2,.an-rule,.an-brk,.an-title,.an-sub { animation: none !important; }
    }
  </style>
  <defs>
    <linearGradient id="e-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#141a24"/><stop offset="1" stop-color="#111722"/>
    </linearGradient>
    <linearGradient id="e-am" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9a15a" stop-opacity="0"/>
      <stop offset=".5" stop-color="#e9a15a" stop-opacity=".17"/>
      <stop offset="1" stop-color="#e9a15a" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="320" fill="url(#e-bg)"/>
  <g class="an-b1"><rect x="-260" y="52" width="980" height="104" fill="url(#e-am)" transform="rotate(-15 640 160)"/></g>
  <g fill="none" stroke="#63c7b8" stroke-width="1.5" stroke-linecap="square">
    <path class="an-brk" d="M40 78 V40 H78" opacity=".5"/>
    <path class="an-brk d2" d="M1202 78 V40 H1164" opacity=".5"/>
    <path class="an-brk d3" d="M40 242 V280 H78" opacity=".5"/>
    <path class="an-brk d4" d="M1202 242 V280 H1164" opacity=".5"/>
  </g>
  <rect class="an-rule" x="616" y="76" width="48" height="3" rx="1.5" fill="#e9a15a" opacity=".7"/>
  <text class="an-title" x="640" y="160" text-anchor="middle" font-size="64" font-weight="600" fill="#dde5f0" opacity="1">E2E Banner</text>
  <text class="an-sub" x="640" y="206" text-anchor="middle" font-size="22" fill="#8b98ab" opacity="1">动效自测：光带漂移 + 括号呼吸 + 文字入场</text>
</svg>
```

> 注意 `<text>` 上的 `opacity="1"`——这就是「首帧即完整可用」的静态基线。

- [ ] **Step 2: 用安全配置压缩并检查关键属性**

在 `.tmp-e2e/` 下写 `svgo.config.mjs`：

```js
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          inlineStyles: false,
          removeUnknownsAndDefaults: false,
          cleanupIds: false,
          minifyStyles: false,
        },
      },
    },
  ],
};
```

Run:
```bash
cd .tmp-e2e
npx svgo --config svgo.config.mjs banner-e2e.svg -o banner-e2e.min.svg
grep -c 'prefers-reduced-motion' banner-e2e.min.svg
grep -c 'role="img"' banner-e2e.min.svg
```

Expected: 两个数字都 **≥ 1**。

> 若第一个是 0，说明配置写错了或没用 `--config`——重新核对 `svgo.config.mjs` 的 overrides。
>
> 本机已实测：压缩后 `media count: 1`、`role count: 1`、体积 2717 bytes（< 6KB 达标）。

- [ ] **Step 3: 生成两个定帧版本**

复制 `banner-e2e.min.svg` 两份，分别注入覆盖规则：

```bash
# f0：相位 0
sed 's#</style>#.an-b1,.an-b2,.an-rule,.an-brk { animation-play-state: paused !important; animation-delay: 0s !important; }\n  </style>#' banner-e2e.min.svg > banner-e2e-f0.svg
# f3：相位 -3s
sed 's#</style>#.an-b1,.an-b2,.an-rule,.an-brk { animation-play-state: paused !important; animation-delay: -3s !important; }\n  </style>#' banner-e2e.min.svg > banner-e2e-f3.svg
```

> **Windows 上不要用内联 PowerShell 拼这个字符串**——嵌套引号与 `$t` 变量会被命令行解析吃掉，直接写成脚本文件执行：
>
> ```powershell
> # probe.ps1
> $t = Get-Content 'banner-e2e.min.svg' -Raw
> $sel = '.an-b1,.an-b2,.an-rule,.an-brk'
> function Write-Variant($delay, $out) {
>   $rule = $sel + ' { animation-play-state: paused !important; animation-delay: ' + $delay + 's !important; }'
>   $s = $t.Replace('</style>', $rule + "`n  </style>")
>   [IO.File]::WriteAllText($out, $s, (New-Object Text.UTF8Encoding($false)))
> }
> Write-Variant '0' 'banner-e2e-f0.svg'
> Write-Variant '-3' 'banner-e2e-f3.svg'
> ```
>
> ```bash
> powershell -NoProfile -ExecutionPolicy Bypass -File probe.ps1
> ```
>
> 用 `[IO.File]::WriteAllText` + `UTF8Encoding($false)` 而不是 `Set-Content -Encoding UTF8`——后者在 PS 5.1 会写 BOM，SVG 带 BOM 可能影响解析。

- [ ] **Step 4: 无头截两帧**

```bash
chrome --headless=new --disable-gpu --hide-scrollbars --run-all-compositor-stages-before-draw --window-size=1280,320 --virtual-time-budget=500 --screenshot=frame0.png "file:///$(pwd)/banner-e2e-f0.svg"
chrome --headless=new --disable-gpu --hide-scrollbars --run-all-compositor-stages-before-draw --window-size=1280,320 --virtual-time-budget=500 --screenshot=frame3.png "file:///$(pwd)/banner-e2e-f3.svg"
```

> Windows 上 `chrome` 可能不在 PATH，用完整路径 `C:\Program Files\Google\Chrome\Application\chrome.exe`。
> `file:///` 后面必须是**绝对路径**，反斜杠换成正斜杠。

Expected: 两个 PNG 都生成成功（实测两个文件体积不同，说明像素确有差异）。

- [ ] **Step 5: 像素差分并做静态对照**

按 `references/motion.md` §7.2 的 `diff.html` 模板，把 frame0.png 与 frame3.png 的 base64 填进去，输出：

```bash
chrome --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom "file:///$(pwd)/diff.html"
```

Expected: 输出里含 `DIFF=<大于 0 的数>`。

> 本机已实测该流程：动效两帧差分 = `DIFF=7049 MAX=224`（> 0，判定通过）。

**再做静态对照**：把 `banner-e2e.min.svg` 去掉 `<style>` 里的 animation 声明（或直接对仓库里 `assets/banner.svg` 之外的任意纯静态 SVG）重复 Step 3–5。

Expected: 静态对照输出 `DIFF=0`。

> 本机已实测静态对照 = `DIFF=0 MAX=0`（判定通过）。

> 两步都符合才算通过：动效 > 0、静态 = 0。缺静态对照就是「判定器坏了却报通过」。

- [ ] **Step 6: 清理临时目录**

```bash
rm -rf .tmp-e2e
```

（Windows PowerShell 若被策略拦截，用顶层 `rm .tmp-e2e`。）

- [ ] **Step 7: 记录自测结论**

在最终回复里如实报告：
- 压缩后 `prefers-reduced-motion` 与 `role="img"` 是否都在
- 动效差分像素数
- 静态对照差分像素数
- 是否需要 `git commit`（本任务不改仓库文件，**不提交**）

---

## 完成标准

- [ ] `npm run build` / `npm run check` / `npm test` 全绿
- [ ] `readme-banner` 版本在 `marketplace.json` 与 `plugin.json` 两处都是 `0.2.0`
- [ ] SKILL.md 的 frontmatter 能解析出 8 个触发词，主页上 readme-banner 卡片显示触发词行
- [ ] README 的 readme-banner 描述段落已手写更新（版本号与触发词行由 build 生成，不要手改那两行）
- [ ] CHANGELOG 的 `## [Unreleased]` 段有 readme-banner 0.2.0 条目
- [ ] Task 6 的三关验证结论如实记录
- [ ] 工作区干净，无临时文件残留

## 附：本次改造沉淀的通用经验

供后续复用，不属于技能本身：

1. **GitHub README 的 `<img src="*.svg">` 只清 `<script>` 与事件处理器，`<style>` + `@keyframes` 保留且会播** ⇒ SVG 是唯一既能动又能小、还能编辑的交付格式。
2. **svgo 默认配置会静默毁掉动效产物的降级规则与 `role`** ⇒ 动效 SVG 必须用专用 overrides。
3. **`--virtual-time-budget` 不是 CSS 动画的时钟** ⇒ 判定动效要用「暂停 + 负延迟」定帧 + 像素差分，不能靠截图时间差，也不能靠 PNG 哈希。
4. **降级选择器必须与实际类名逐字一致** ⇒ 写完要核对，否则规则从未生效且外观上看不出来。