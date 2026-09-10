# Wake-Skills

个人 Mavis skill 仓库。每个 skill 一个目录，遵循 `mavis skill install <git-url>` 的标准约定。

> **Mavis** 是 MiniMax 出品的 self-hosted multi-agent runtime。skill 是给 agent 加能力的最小单元——一个 `SKILL.md` 加几份 `references/*.md` 就够了。

## 当前 skill

### [readme-craft](./readme-craft)

生成标准化、GFM 规范、人性化措辞的 README.md。可以读项目根目录的 `AGENTS.md` / `CLAUDE.md` 作为补充上下文。

覆盖 5 种项目类型：library / CLI / web-app / API / tutorial；带 3 份 reference（`templates.md` 写模板、`gfm-syntax.md` 管语法、`humanizer-rules.md` 防 AI 味）。

触发词：`生成 README`、`写 README`、`补项目文档`、`新项目初始化 README`。

### [article-valuator](./article-valuator)

评估一篇文章值不值得读/学。输入链接（自动抓取正文，含微信公众号反爬兜底策略）或粘贴文本，按 **深度与信息密度 / 可操作性 / 新颖度与时效 / 相关性** 四维打分（各带一句原文证据），输出 10 分制总分 + 明确结论（精读/浏览/跳过）+ 理由，可选继续生成内容摘要 / 亮点与槽点 / 阅读指南。

触发词：`这篇文章值不值得读`、`评估这个链接`、`这篇文章有价值吗`、`要不要收藏这篇`、`这是不是软文`、`看看这个有没有干货`。

## 安装

### 作为 ZCode 插件市场

本仓库同时是一个 ZCode 插件市场（marketplace manifest 在 `.claude-plugin/marketplace.json`），在 ZCode 里添加插件市场时填入仓库地址即可：

```
https://github.com/uwakeme/Wake-Skills.git
```

添加后可以按插件安装 `article-valuator` 或 `readme-craft`（每个 skill 一个独立插件，清单在其目录下的 `.claude-plugin/plugin.json`）。

### 作为 Mavis skill 仓库

全局安装（所有 agent 可见）：

```powershell
# 整个仓库
mavis skill install https://github.com/uwakeme/Wake-Skills

# 只装 readme-craft
mavis skill install https://github.com/uwakeme/Wake-Skills/tree/main/readme-craft
```

指定 agent：

```powershell
mavis skill install https://github.com/uwakeme/Wake-Skills -a <agent-name>
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
