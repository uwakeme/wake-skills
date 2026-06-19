# Wake-Skills

个人 Mavis skill 仓库。每个 skill 一个目录，遵循 `mavis skill install <git-url>` 的标准约定。

> **Mavis** 是 MiniMax 出品的 self-hosted multi-agent runtime。skill 是给 agent 加能力的最小单元——一个 `SKILL.md` 加几份 `references/*.md` 就够了。

## 当前 skill

### [readme-craft](./readme-craft)

生成标准化、GFM 规范、人性化措辞的 README.md。可以读项目根目录的 `AGENTS.md` / `CLAUDE.md` 作为补充上下文。

覆盖 5 种项目类型：library / CLI / web-app / API / tutorial；带 3 份 reference（`templates.md` 写模板、`gfm-syntax.md` 管语法、`humanizer-rules.md` 防 AI 味）。

触发词：`生成 README`、`写 README`、`补项目文档`、`新项目初始化 README`。

## 安装

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
├── SKILL.md           # 必备，frontmatter 含 name / description
└── references/        # 可选，详细参考（按需回查，不进主 context）
```

开发一个新 skill 时：

1. 用 `mavis skill create <name> -a <agent> --file ./SKILL.md` 起骨架，或手写
2. 跑 `node <skill-creator>/scripts/lint-skill.js <dir>` 验证
3. 写一两个真实项目验证效果，再考虑发布

## License

[MIT](./LICENSE) — 自由使用、修改、分发、商用，保留版权声明即可。
