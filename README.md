# Wake-Skills

个人 skill 仓库，一套 skill 同时适配两种格式：**Mavis skill**（每个 skill 一个目录，遵循 `mavis skill install <git-url>` 的标准约定）和 **ZCode 插件**（每个 skill 都带 `.claude-plugin/plugin.json` 清单，整个仓库可作为一个 ZCode 插件市场添加）。

> **Mavis** 是 MiniMax 出品的 self-hosted multi-agent runtime。skill 是给 agent 加能力的最小单元——一个 `SKILL.md` 加几份 `references/*.md` 就够了。

## 当前 skill

### [readme-craft](./readme-craft)

生成标准化、GFM 规范、人性化措辞的 README.md。可以读项目根目录的 `AGENTS.md` / `CLAUDE.md` 作为补充上下文。默认依据项目自动生成一张顶部 banner（手写 SVG 永远可行；环境里有生图工具时也可走位图路径）并嵌入 README。

覆盖 5 种项目类型：library / CLI / web-app / API / tutorial；带 4 份 reference（`templates.md` 写模板、`gfm-syntax.md` 管语法、`humanizer-rules.md` 防 AI 味、`banner.md` 管 banner 生成）。

触发词：`生成 README`、`写 README`、`补项目文档`、`新项目初始化 README`。

### [article-valuator](./article-valuator)

评估一篇文章值不值得读/学。输入链接（自动抓取正文，含微信公众号反爬兜底策略）或粘贴文本，按 **深度与信息密度 / 可操作性 / 新颖度与时效 / 相关性** 四维打分（各带一句原文证据），输出 10 分制总分 + 明确结论（精读/浏览/跳过）+ 理由，可选继续生成内容摘要 / 亮点与槽点 / 阅读指南。

触发词：`这篇文章值不值得读`、`评估这个链接`、`这篇文章有价值吗`、`要不要收藏这篇`、`这是不是软文`、`看看这个有没有干货`。

### [readme-banner](./readme-banner)

为 GitHub README 顶部生成 hero / banner 图。两种生成路径可选：让 LLM 直接写干净的 SVG 代码（首选，体积小、可二次编辑），或用图像 AI（Midjourney / DALL-E / SDXL）出位图再矢量化。也支持两种都跑、各出 3 张候选对比。带 3 份 reference：`prompt-svg.md` / `prompt-image.md` / `design-spec.md`。

触发词：`生成 README banner`、`做个项目 banner`、`README 顶部图`、`SVG banner`、`hero 图`。

### [changelog-craft](./changelog-craft)

维护符合 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-CN/1.1.0/) 规范、说人话的 CHANGELOG.md。双模式：提交时逐笔判定改动是否值得写一条（追加进 `Unreleased` 段、随同一次 commit 提交），发版时把 `Unreleased` 归段成新版本并对照 git log 补漏。纯写作边界——不碰 tag、不碰发布。

触发词：`生成 CHANGELOG`、`写 changelog`、`更新更新日志`、`这个版本改了啥`、`提交`（提交意图命中先过判定规则）。

### [homepage-craft](./homepage-craft)

为开源项目生成优美的主页：扫描仓库（manifest、README、截图、git 元信息），产出单文件 HTML landing page（默认 `docs/index.html`，推上 GitHub Pages 即发布）。内容 100% 来自仓库真实素材，不编造数字和占位图。核心特性是**编排已安装的设计类 skill**——探测到 `ui-ux-pro-max` 就用它出设计系统、`frontend-design` / `superdesign` 管实现美感，一个都没装时退回内置设计基线（三风格方向 + 反 AI-slop 清单）。生成后可经用户确认**自动部署到 GitHub Pages**（commit + push + `gh` 开启 Pages；gh 不可用时降级为只推代码并给出手动开启步骤）；**发布策略由用户决定**：随 main 分支 + `/docs` 同提交同步，或把发布拷贝隔离到独立 `gh-pages` 分支（git worktree 操作，不碰工作区）。带 2 份 reference：`page-anatomy.md` 管章节结构与自检、`design-baseline.md` 管兜底美学。

触发词：`给项目生成主页`、`做一个 landing page`、`生成项目官网`、`GitHub Pages 首页`、`把 README 变成网页`、`把主页部署上线`。

## 安装

### 作为 ZCode 插件市场

本仓库同时是一个 ZCode 插件市场（marketplace manifest 在 `.claude-plugin/marketplace.json`），在 ZCode 里添加插件市场时填入仓库地址即可：

```
https://github.com/uwakeme/wake-skills.git
```

添加后上述每个 skill 都可以按插件独立安装（清单在各目录下的 `.claude-plugin/plugin.json`）。

### 作为 Mavis skill 仓库

全局安装（所有 agent 可见）：

```powershell
# 整个仓库
mavis skill install https://github.com/uwakeme/wake-skills

# 只装 readme-craft
mavis skill install https://github.com/uwakeme/wake-skills/tree/main/readme-craft
```

指定 agent：

```powershell
mavis skill install https://github.com/uwakeme/wake-skills -a <agent-name>
```

安装后**下一个 session** 即可使用，daemon 不需要重启。

## 仓库约定

每个 skill 一个目录，结构如下：

```
<skill-name>/
├── .claude-plugin/
│   └── plugin.json    # ZCode 插件清单（skills: "." 指向本目录）
├── SKILL.md           # 必备，frontmatter 含 name / description
└── references/        # 可选，详细参考（按需回查，不进主 context）
```

开发一个新 skill 时：

1. 用 `mavis skill create <name> -a <agent> --file ./SKILL.md` 起骨架，或手写
2. 跑 `node <skill-creator>/scripts/lint-skill.js <dir>` 验证
3. 写一两个真实项目验证效果，再考虑发布

## License

[MIT](./LICENSE) — 自由使用、修改、分发、商用，保留版权声明即可。
