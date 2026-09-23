# page-anatomy — 页面结构、骨架规范与自检清单

本文件规定"页面由什么组成、HTML 怎么写、发布前要查什么"。风格与视觉决策不在这里——companion skill 命中时听它的，未命中时看 `design-baseline.md`。

## 目录

1. [章节池与项目类型映射](#1-章节池与项目类型映射)
2. [HTML 骨架硬规范](#2-html-骨架硬规范)
3. [必备 head 片段](#3-必备-head-片段)
4. [复制按钮与轻量 JS](#4-复制按钮与轻量-js)
5. [GitHub Pages 资源规则](#5-github-pages-资源规则)
6. [发布前自检清单](#6-发布前自检清单)

---

## 1. 章节池与项目类型映射

**必备章节**（任何项目类型都要有）：

| 章节 | 内容 | 注意 |
| --- | --- | --- |
| Nav | 项目名/logo + 锚点链接（Features / Quick Start / 仓库外链） | 移动端折叠或只留 logo + GitHub 链接 |
| Hero | 项目名 + tagline + 主 CTA（GitHub 仓库）+ 副 CTA（文档/安装） | 一屏内说完"这是啥、给谁用"；有 logo/截图就用，没有就用排版和色块撑 |
| Quick Start | 安装命令（带复制按钮）+ 最小用法 | 命令必须来自 README/manifest 真实内容 |
| Footer | license、仓库链接、"本页由仓库内容生成"可省 | 不放编造的联系方式 |

**按项目类型追加**（从池子里挑，宁少勿滥）：

| 项目类型 | 强烈建议 | 可选 | 不要 |
| --- | --- | --- | --- |
| library / SDK | Features(3–6 条)、代码用法示例 | API 预览、生态/集成 logo 墙 | 定价表 |
| CLI 工具 | Features、终端演示（截图或 `<pre>` 动画降级为静态） | 命令速查表 | 大段架构叙述 |
| web-app | 截图画廊、Features | 在线 demo 入口、技术栈 | 安装章节放首屏（先给 demo） |
| API 服务 | Endpoints 概览、认证说明 | 状态页链接、SDK 列表 | 完整 API 文档（链接过去） |
| tutorial / 学习项目 | 学习内容、章节步骤 | 适合人群、先修要求 | 营销式功能列表 |
| other | Features 或 About 二选一 | — | 硬凑章节 |

**通用可选章节**：Screenshots 画廊、Stats（stars/version/license，只用真实数字）、Tech Stack、FAQ（README 里真有高频问题才做）、Contributors（GitHub API 可得时）、末尾 CTA 区（star 引导 + 仓库按钮）。

**章节数量基线**：小项目 4–5 节，成熟项目 6–8 节。超过 8 节说明在凑数，砍掉最弱的。

---

## 2. HTML 骨架硬规范

```html
<!DOCTYPE html>
<html lang="en"> <!-- 跟随页面语言：zh-CN / ja / ... -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- title / description / OG / favicon / JSON-LD 见 §3 -->
  <style>/* 全部 CSS 内联在此，含媒体查询 */</style>
</head>
<body>
  <header><!-- Nav --></header>
  <main>
    <section id="hero">…</section>
    <section id="features">…</section>
    <section id="quick-start">…</section>
    <!-- 按 §1 映射追加 -->
  </main>
  <footer>…</footer>
  <script>/* 仅 §4 允许的轻量脚本 */</script>
</body>
</html>
```

规则：

- 语义标签：`header / nav / main / section / footer`，标题层级 `h1`（仅 hero 项目名）→ `h2`（章节）→ `h3`（子项），不跳级
- 锚点 id 与 nav 链接一一对应；`html { scroll-behavior: smooth }` 且被 `prefers-reduced-motion` 覆盖
- 所有图片有 `alt`、`width`/`height`（或 CSS aspect-ratio），避免布局偏移
- 外链带 `target="_blank" rel="noopener"`
- CSS 变量集中定义 design tokens（颜色、字体、间距、圆角），改主题只动一处
- 断点两档足够：`max-width: 768px`（移动）与 `min-width: 769px`（桌面）；不要为中间尺寸写第三套布局
- 暗色方案二选一：整站单模式（跟随设计系统），或 `prefers-color-scheme` 双模式（tokens 成对定义）。不要做手动切换按钮（多一个状态多一份出错面）

---

## 3. 必备 head 片段

```html
<title>{{项目名}} — {{tagline，≤60 字符}}</title>
<meta name="description" content="{{一句话介绍，≤155 字符}}">

<!-- Open Graph：分享卡片的来源，缺了社交平台只会显示裸链接 -->
<meta property="og:title" content="{{项目名}}">
<meta property="og:description" content="{{同 description}}">
<meta property="og:type" content="website">
<meta property="og:url" content="{{GitHub Pages 预期 URL；未定就填仓库 URL}}">
<meta property="og:image" content="{{hero 截图或 banner 的绝对 URL；raw.githubusercontent 最稳}}">
<meta name="twitter:card" content="summary_large_image">

<!-- favicon：内联 SVG data URI，不依赖外部文件 -->
<link rel="icon" href="data:image/svg+xml,{{URL 编码的极简 SVG：项目首字母或 logo 图形}}">

<!-- JSON-LD：搜索引擎理解"这是个软件" -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{{项目名}}",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "{{从 README 推断，写不出就 All}}",
  "offers": { "@type": "Offer", "price": "0" },
  "license": "{{license SPDX 标识，如 MIT}}",
  "codeRepository": "{{仓库 URL}}"
}
</script>
```

- `og:image` 没有现成大图时：用仓库现有 banner/截图；都没有就省略该标签（比放错图强）
- JSON-LD 里 license 未知就整段省略 `offers`/`license` 字段，不写 `"Unknown"`

---

## 4. 复制按钮与轻量 JS

全页 JS 只允许三件事：安装命令复制、滚动渐显（可省）、移动端 nav 折叠（可省）。模板：

```html
<div class="install">
  <code id="install-cmd">npm install {{包名}}</code>
  <button type="button" class="copy-btn" data-copy="install-cmd" aria-label="Copy install command">Copy</button>
</div>
```

```js
document.querySelectorAll('.copy-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var text = document.getElementById(btn.dataset.copy).textContent.trim();
    // file:// 下 navigator.clipboard 可能不可用，execCommand 兜底
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    btn.textContent = 'Copied!';
    setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
  });
});
```

滚动渐显（如用）：`IntersectionObserver` 给进入视口的 section 加 `.visible`，CSS 里 `@media (prefers-reduced-motion: reduce)` 时直接全部可见、无过渡。

---

## 5. GitHub Pages 资源规则

GitHub Pages 以 `docs/` 为站点根发布时，**站点外的相对路径一律 404**：

| 写法 | 结果 |
| --- | --- |
| `assets/shot.png`（图在 `docs/assets/`） | ✅ |
| `../assets/shot.png`（图在仓库根 `assets/`） | ❌ 404 |
| `https://raw.githubusercontent.com/<user>/<repo>/HEAD/docs/assets/shot.png` | ✅（远程模式用；注意 HEAD 分支名解析） |

因此本地模式下：页面引用的每张图**拷贝**一份到 `docs/assets/`（原文件不动，README 引用不受影响），页面内用相对路径。文件名保持原名，冲突时加前缀。

同理适用于 favicon 之外的任何静态资源；CSS/JS 本来就内联，无此问题。

---

## 6. 发布前自检清单

无浏览器工具时逐项过；有浏览器工具时第 1、2 组仍要程序化查（截图看不出来）：

**内容与占位符**

- [ ] grep 无残留：`TODO`、`TBD`、`xxx`、`YOUR-`、`{{`、`lorem`、`placeholder`、`待补充`
- [ ] 页面上每个功能点都能在 README / manifest 里找到出处
- [ ] 所有数字（stars、version、下载量）有真实来源，否则已移除
- [ ] 所有链接可达：仓库、文档、demo、包注册表、og:image
- [ ] 安装命令逐字符核对 README（包名、scope、`--save` 之类参数）

**结构与资源**

- [ ] `<html lang>` 与页面语言一致；`h1` 只有一个
- [ ] 引用的本地图片全部真实存在于 `docs/assets/`
- [ ] OG / Twitter / JSON-LD / favicon 四件套齐全，JSON-LD 是合法 JSON
- [ ] 标签配对（可用 python `html.parser` 快扫一遍）
- [ ] HTML 本体 ≤ 200KB；无 base64 内联大图（>10KB 的图一律走文件引用）

**响应式与可访问性**

- [ ] 375px 宽度无横向滚动条；nav 可用；hero 文案不溢出
- [ ] 正文对比度 ≥ 4.5:1（拿不准用 python 算相对亮度）
- [ ] 所有交互元素可聚焦（button 是真 `<button>`，不是 div onclick）
- [ ] `prefers-reduced-motion` 下无动画残留
