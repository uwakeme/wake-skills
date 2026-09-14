# changelog-craft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `changelog-craft` 技能——双模式维护 Keep a Changelog 1.1.0 规范的 CHANGELOG.md（提交时逐笔判定补 Unreleased；发版时归段成版本）。

**Architecture:** 纯 markdown 技能（SKILL.md + 1 份自包含 reference），沿用 readme-craft 的家规风格（中文、表格驱动、frontmatter 带 risk/source、触发词+边界声明），注册进 `.claude-plugin/marketplace.json` 与仓库 README。无运行时代码，验证 = 结构/JSON 校验 + 在本仓库 dogfood。

**Tech Stack:** Markdown（GFM）、JSON（plugin 清单）、git 只读命令。

**Spec:** `docs/superpowers/specs/2026-09-15-changelog-craft-design.md`（v2，已批准）

## Global Constraints

- **纯写作边界**：不创建 tag、不发布 Release、不自动 commit；逐笔模式只把 `CHANGELOG.md` 加入用户当次 commit
- **references 自包含**：不跨插件引用（readme-banner/readme-craft 的文件可能不存在）
- **规范出处 URL 必须出现在 SKILL.md 与 format.md 顶部**，逐字使用：`https://keepachangelog.com/en/1.1.0` 和 `https://keepachangelog.com/zh-CN/1.1.0/`
- frontmatter 固定：`name: changelog-craft`、`risk: safe`、`source: "self-authored"`；plugin.json 与 marketplace 条目 `version` 均为 `0.1.0`
- 六大类英文类名固定：`Added / Changed / Deprecated / Removed / Fixed / Security`；另设技能扩展类 `Internal Changes`；entry 正文语言随仓库习惯
- 版本标题格式 `## [1.2.0] - 2026-09-15`，日期一律 `YYYY-MM-DD`，新版本在上
- 备份规则同 readme-craft：`.bak` 已存在改用 `<file>.<YYYYMMDD-HHMMSS>.bak`，绝不覆盖旧备份
- 风格对齐 readme-craft/SKILL.md：中文、表格驱动、terse、每个可选行为都写明反例

---

### Task 1: 技能主体 — SKILL.md + plugin.json

**Files:**
- Create: `changelog-craft/SKILL.md`
- Create: `changelog-craft/.claude-plugin/plugin.json`

**Interfaces:**
- Consumes: 无
- Produces: 技能目录骨架；`changelog-craft` 名称供 Task 3 的市场注册引用；`references/format.md` 路径被 SKILL.md 引用（Task 2 创建）

- [ ] **Step 1: 写入 SKILL.md**

创建 `changelog-craft/SKILL.md`，内容逐字如下：

```markdown
---
name: changelog-craft
description: |
  维护一份符合 Keep a Changelog 1.1.0 规范、说人话的 CHANGELOG.md。
  双模式：A 逐笔模式（核心）——命中提交意图时先判定本次改动是否值得写一条，
  值得就追加进 Unreleased 段并随同一次 commit 提交；B 成段模式（发版时）——
  把 Unreleased 归段成新版本，必要时对照 git log 补漏。

  触发："生成 CHANGELOG"、"写 changelog"、"更新更新日志"、"这个版本改了啥"、
  "整理 release notes"，以及提交意图："提交"、"commit"、"帮我提交这些改动"
  （命中提交意图先过判定规则，再走正常提交流程）。

  不要在以下情况使用：
  - 只想发布 GitHub Release → 用 github:release（本技能产出的最新版本段可直接粘给它用）
  - 想连 tag 创建一起管 → readme-craft Step 1.6
  - 生成 API 级接口 diff 清单 → 用专门的 API 文档工具
risk: safe
source: "self-authored"
---

# changelog-craft

维护项目根的 `CHANGELOG.md`：提交时逐笔补 `Unreleased`，发版时归段成版本。格式规范：[Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0)（[中文版](https://keepachangelog.com/zh-CN/1.1.0/)），细则与模板见 `references/format.md`。

## 设计原则

| 原则 | 含义 | 反例 |
| --- | --- | --- |
| **说人话** | 每条 entry 写"使用者可感知的变化"，不复述 commit message | `fix: fix bug` 原样进日志 |
| **逐笔维护** | diff 还热着的时候写，上下文最全 | 发版前靠回忆整理一个月的改动 |
| **策展** | Unreleased 从宽、版本段收紧，噪音不进 | 30 条 chore 全列上 |
| **纯写作** | 不碰 tag、不碰发布、不自动 commit | 悄悄替用户打 tag 推送 |

## 模式判定（入口）

| 用户意图 | 走哪条 |
| --- | --- |
| 提交意图（"提交"、"commit"、"帮我提交这些改动"） | **模式 A**：先过下面的判定规则，再走正常提交流程 |
| "生成 / 更新 CHANGELOG"、"这个版本改了啥"、发版语境 | **模式 B** |

## 模式 A — 逐笔（核心）

**判定基于 staged diff**（还没 stage 就先看工作区改动）：

| 变化 | 动作 |
| --- | --- |
| 新功能 / 既有行为变化 / bug 修复 / 废弃 / 移除 / 安全问题 | **写**，归入对应大类 |
| 可感知的性能改善 / 有行为影响的依赖升级 | **写** |
| 纯重构 / CI / 构建 / 内部测试 / typo / 纯文档 | **不写**——报告一句"本次无可写条目"，不追问 |
| 拿不准 | **写**，并在报告里注明（漏写不可找回，多写可在成段时删） |

**流程**：

1. 无条目 → 报告"本次无可写条目"，结束（默认不吵）
2. 有条目 → 按模式 B Step 4 的撰写规则起草 1-3 条，追加进 `Unreleased` 段对应大类
3. 项目还没有 `CHANGELOG.md` → **问一次**"要初始化吗"：初始化 = `references/format.md` 的骨架 + SemVer 声明 + 本次条目；**不**主动全量回溯历史（用户要才转模式 B）
4. `CHANGELOG.md` 加入本次 commit 的 staged 文件一起提交（不另起提交）；报告写了哪些条目

> 触发机制是提示层约定：建议用户在常维护项目的 `AGENTS.md` / `CLAUDE.md` 里加一行"commit 前按 changelog-craft 检查"。git hook 硬自动化不在本技能范围。

## 模式 B — 成段（发版时）

### Step 1 — 摸底

git tag 列表 + 最新 tag；manifest（`package.json` / `pyproject.toml` 等）的 version；已有 `CHANGELOG.md` 读出覆盖到哪个版本、什么语言、什么分组风格；抽样最近 20 条提交判断语言习惯（中文仓库 entries 用中文写）。

### Step 2 — 范围判定

| 情况 | 动作 |
| --- | --- |
| 已有 CHANGELOG，`Unreleased` 有条目 | 归段：挪进新版本段，补发布日期和 compare 链接 |
| 已有 CHANGELOG，`Unreleased` 空 | 对照 git log（上个 tag..HEAD）补漏——逐笔模式可能被跳过过 |
| 没有 CHANGELOG | 全量生成：按 tag 分段回溯；版本 > 10 个时问"全量还是从某个版本起" |
| 无 tag 仓库 | 全部进 `Unreleased`，提示"打 tag 后可归段"（不代打） |

用户明确要求修正 / 补漏历史段落时可以改写（规范允许），**先备份**。

### Step 3 — 素材归类

- `Unreleased` 现有条目为主，git log 兜底补漏
- 按 `references/format.md` 的判定树分组；Merge / `chore` / typo 噪音丢弃或归 `Internal Changes`
- 提交信息看不出用户价值的：看 diff / 文件路径推断；仍判断不了的合并为一句话，实在不行兜底问一次 highlights（一次问完，不逐条追问）

### Step 4 — 撰写（两模式共用）

- **每条 entry 写"使用者可感知的变化"，不复述 commit message**——规范反模式第一条就是 commit log dump（`fix bug` → 修了什么、影响谁）
- 面向使用者写，不面向协作者写：纯内部重构归 `Internal Changes` 一笔带过
- 条目带 short-hash 链接（文件底部引用区）
- 反 AI 味：破折号节制、不堆形容词、每条是完整的句子

### Step 5 — 自检写入

- [ ] 版本号与 tag / manifest 一致（只读，不猜 semver、不建议升版本）
- [ ] Merge / release 前缀已清洗，日期 `YYYY-MM-DD`，新版本在上
- [ ] 六大类名称同文件内统一（类名英文，不中英混用）
- [ ] 无占位符，链接有效
- [ ] 已有文件先备份（`.bak` 已存在改用 `<file>.<YYYYMMDD-HHMMSS>.bak`，绝不覆盖旧备份）

## 语言策略

单语言，跟随主 README 的语言（读 `README.md` 判断；读不出问一次）。**不做多语言 CHANGELOG**。

## Failure handling

| 情况 | 处理 |
| --- | --- |
| 逐笔模式项目还没有 CHANGELOG.md | 问一次初始化；不主动全量回溯 |
| 非 git 仓库 | 模式 B 无法跑（没有历史）；模式 A 仍可用（只有 Unreleased） |
| 提交信息全是噪音，推不出条目 | 兜底问一次 highlights；问不出就如实写一条 `Internal Changes` |
| 用户中途说"这条别写" | 删掉该条目，不追问 |
| `.bak` 已存在 | 改用时间戳备份名，不覆盖旧备份 |

## 与相邻 skill 的边界

| 想要…… | 用什么 |
| --- | --- |
| 写 / 更新 CHANGELOG.md | **changelog-craft**（本技能） |
| 发布 GitHub Release | `github:release`（本技能产出的最新版本段可直接粘给它） |
| 打 tag | readme-craft Step 1.6 或手动 |
| README 本身 | readme-craft |
| README banner | readme-banner |

## Windows (win32) platform notes

git tag / log / remote 只读命令 + Read / Write / Grep 工具，跨平台通用，无需适配；`.bak` 备份用 Write 复制内容而非 shell copy。
```

- [ ] **Step 2: 写入 plugin.json**

创建 `changelog-craft/.claude-plugin/plugin.json`，内容逐字如下：

```json
{
  "name": "changelog-craft",
  "version": "0.1.0",
  "description": "Maintain a Keep a Changelog 1.1.0-compliant, human-sounding CHANGELOG.md with per-commit entry checks and release-time consolidation.",
  "author": { "name": "uwakeme" },
  "license": "MIT",
  "skills": "."
}
```

- [ ] **Step 3: 校验**

```bash
node -e "JSON.parse(require('fs').readFileSync('changelog-craft/.claude-plugin/plugin.json','utf8')); console.log('JSON OK')"
grep -c "^name: changelog-craft" changelog-craft/SKILL.md        # 期望 1
grep -c "keepachangelog.com/en/1.1.0" changelog-craft/SKILL.md   # 期望 >= 1
grep -c "keepachangelog.com/zh-CN/1.1.0" changelog-craft/SKILL.md # 期望 >= 1
grep -c "references/format.md" changelog-craft/SKILL.md          # 期望 >= 1
```

期望：JSON OK；四个 grep 各命中。

- [ ] **Step 4: Commit**

```bash
git add changelog-craft/
git commit -m "新增 changelog-craft 技能主体：双模式 CHANGELOG 维护（逐笔判定 + 发版归段）"
```

---

### Task 2: references/format.md — 规范要点、判定树与初始化模板

**Files:**
- Create: `changelog-craft/references/format.md`

**Interfaces:**
- Consumes: Task 1 的 SKILL.md 已引用 `references/format.md`
- Produces: 骨架模板、六大类判定树，供技能运行时按需回查

- [ ] **Step 1: 写入 format.md**

创建 `changelog-craft/references/format.md`，内容逐字如下：

````markdown
# CHANGELOG 格式规范（Keep a Changelog 1.1.0 要点）

> 规范出处：[Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0) / [中文版](https://keepachangelog.com/zh-CN/1.1.0/)。
> 本文件自包含。只在初始化骨架、分组拿不准、格式细节存疑时读；常规流程看 SKILL.md 就够。

---

## 初始化骨架

中文仓库（entry 正文用中文，类名保留英文）：

```markdown
# Changelog

本项目的所有显著变更都将记录在本文件。

格式基于 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.0] - 2026-09-15
### Added
- 首个发布，包含 xxx、yyy

[Unreleased]: https://github.com/<user>/<repo>/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/<user>/<repo>/releases/tag/v0.1.0
```

英文仓库 intro 换成：

```markdown
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).
```

`<user>/<repo>` 从 `git remote get-url origin` 提取（`git@github.com:user/repo.git` 和 `https://github.com/user/repo.git` 都取 `user/repo`）；非 GitHub remote 就删掉底部引用区，条目不带 hash 链接。项目是否遵循 SemVer 照实声明，不遵循就删那句。

---

## 六大类判定树

拿不准归哪类时按顺序问：

1. 是使用者能用到的全新能力 / 命令 / 选项 / 文件吗？ → **Added**
2. 既有行为变了吗（含可感知的性能变化）？ → **Changed**
3. 还在但官方建议别再新用了？ → **Deprecated**
4. 彻底删了（功能 / 文件 / 导出）？ → **Removed**
5. 之前的行为是错的，现在对了？ → **Fixed**
6. 安全漏洞 / 权限问题？ → **Security**
7. 以上都不是（纯内部改动）？ → **Internal Changes**（本技能扩展类，规范外；一笔带过，成段时可整体删）

注意：

- **Deprecated ≠ Removed**：先废弃后移除的功能，两个类各记一条
- 破坏性变更无论归哪类都要显著措辞：`**破坏性**：...`（英文仓库 `**Breaking:** ...`）

---

## 硬规则

| 规则 | 说明 |
| --- | --- |
| 版本标题 | `## [1.2.0] - 2026-09-15`——方括号版本 + ISO 日期，新的在上 |
| Unreleased | 永远置顶；成段时条目挪进新版本段，`Unreleased` 留空壳继续用 |
| 类名 | 六大类固定英文，同文件内统一，不中英混用 |
| 日期 | 一律 `YYYY-MM-DD`，不用 `9/15号` 这类含糊格式 |
| [YANKED] | 撤回的版本保留条目，标题加标记：`## [1.2.1] - 2026-09-15 [YANKED]`，正文一句原因 |
| 链接 | 文件底部 reference-style：版本间用 compare 链接（`.../compare/v1.1.0...v1.2.0`），首版用 release/tag 链接 |
| 声明 | 头部 intro 必须注明遵循 Keep a Changelog；SemVer 声明照实写 |

---

## 反例（一眼不专业）

- **commit dump**：把 git log 逐条搬进来（Merge branch、typo 修复全上）——规范点名的第一反模式
- "各种改进和性能优化"式的空段落——每条必须具体到能判断影响
- 无日期或含糊日期
- 重写历史段落不做备份
- Deprecated 的东西直接消失（没提前进 Deprecated 也没进 Removed）
````

- [ ] **Step 2: 校验**

```bash
grep -c "keepachangelog.com/zh-CN/1.1.0/" changelog-craft/references/format.md  # 期望 >= 1
grep -c "Internal Changes" changelog-craft/references/format.md                 # 期望 >= 1
grep -c "YANKED" changelog-craft/references/format.md                           # 期望 >= 1
grep -c "初始化骨架" changelog-craft/references/format.md                        # 期望 >= 1
```

- [ ] **Step 3: Commit**

```bash
git add changelog-craft/references/format.md
git commit -m "changelog-craft：format.md（1.1.0 规范要点、判定树、初始化模板）"
```

---

### Task 3: 市场注册与仓库 README 登记

**Files:**
- Modify: `.claude-plugin/marketplace.json`（`plugins` 数组末尾追加条目）
- Modify: `README.md`（「当前 skill」一节 readme-banner 之后追加小节）

**Interfaces:**
- Consumes: Task 1 的目录名 `changelog-craft`（marketplace `source` 指向它）
- Produces: 无

- [ ] **Step 1: marketplace.json 追加条目**

在 `plugins` 数组最后一个条目（readme-banner）的 `}` 之后追加 `,` 与以下对象：

```json
    {
      "name": "changelog-craft",
      "source": "./changelog-craft",
      "description": "Maintain a Keep a Changelog 1.1.0-compliant, human-sounding CHANGELOG.md. Per-commit mode checks whether a change deserves an entry (appended to Unreleased and committed together); release mode consolidates Unreleased into a version section, backfilling from git log.",
      "description_i18n": {
        "en": "Maintain a Keep a Changelog 1.1.0-compliant, human-sounding CHANGELOG.md. Per-commit mode checks whether a change deserves an entry (appended to Unreleased and committed together); release mode consolidates Unreleased into a version section, backfilling from git log.",
        "zh-CN": "维护符合 Keep a Changelog 1.1.0 规范、说人话的 CHANGELOG.md。逐笔模式在提交时判定改动是否值得写一条（追加进 Unreleased 并随本次提交），成段模式在发版时把 Unreleased 归段成新版本并对照 git log 补漏。"
      },
      "version": "0.1.0",
      "author": {
        "name": "uwakeme"
      },
      "category": "documentation",
      "keywords": [
        "changelog",
        "release-notes",
        "git",
        "skills"
      ]
    }
```

- [ ] **Step 2: README.md 追加小节**

在 `### [readme-banner](./readme-banner)` 小节（其触发词行之后）、`## 安装` 标题之前插入：

```markdown
### [changelog-craft](./changelog-craft)

维护符合 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-CN/1.1.0/) 规范、说人话的 CHANGELOG.md。双模式：提交时逐笔判定改动是否值得写一条（追加进 `Unreleased` 段、随同一次 commit 提交），发版时把 `Unreleased` 归段成新版本并对照 git log 补漏。纯写作边界——不碰 tag、不碰发布。

触发词：`生成 CHANGELOG`、`写 changelog`、`更新更新日志`、`这个版本改了啥`、`提交`（提交意图命中先过判定规则）。
```

- [ ] **Step 3: 校验**

```bash
node -e "const j=JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8')); console.log(j.plugins.map(p=>p.name).join(','))"
# 期望：article-valuator,readme-craft,readme-banner,changelog-craft
grep -c "changelog-craft" README.md   # 期望 >= 2
```

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/marketplace.json README.md
git commit -m "注册 changelog-craft 到插件市场与仓库 README"
```

---

### Task 4: Dogfood 验证 — 在本仓库跑成段模式

**Files:**
- Create: `CHANGELOG.md`（本仓库自己的，由技能流程产出）

**Interfaces:**
- Consumes: Task 1-3 产出的技能（按 SKILL.md 流程执行）
- Produces: 本仓库 CHANGELOG.md；对技能效果的用户目检结论

- [ ] **Step 1: 按模式 B 全量跑本仓库**

本仓库零 tag、无 CHANGELOG、提交历史完整（10+ 提交）——覆盖 spec §9 的"无 tag 全进 Unreleased"+"全量回溯"路径。严格执行 SKILL.md：Step 1 摸底（git log 全历史、判断中文提交语言）→ Step 2（无 tag 分支）→ Step 3 归类 → Step 4 撰写（把 Task 1-3 的提交整理成"新增 changelog-craft 技能"等使用者可感知条目；marketplace 提交等归 Internal 或并入）→ Step 5 自检。产物为只有 `Unreleased` 段 + 底部引用区（无 GitHub remote 比对需求——本仓库 remote 是 GitHub，`uwakeme/wake-skills`，但零 tag 无法构造 compare 链接，引用区留 `Unreleased: .../compare/...HEAD` 即可）。

- [ ] **Step 2: 用户目检**

向用户展示生成的 CHANGELOG.md，确认条目措辞"说人话"标准达标。**此步是人工 gate，不通过则按反馈修正后重验。**

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "生成 CHANGELOG.md（changelog-craft 首次 dogfood）"
git push origin main
```

注：逐笔模式（spec §9 验证 1）不由本计划模拟——本计划收尾后的下一次真实提交即为其首次真实触发场景。

---

## Self-Review 结论

- **Spec 覆盖**：§1 定位/触发/边界 → Task 1 SKILL.md；§2 规范对齐表 → Task 2 format.md；§3 逐笔模式 → Task 1 SKILL.md 模式 A；§4 成段模式 → Task 1 SKILL.md 模式 B + Task 4；§5 语言策略 → Task 1；§6 文件结构 → Task 1/2；§7 市场登记 → Task 3；§8 验证 → Task 4（逐笔部分明确转为自然触发）。无缺口。
- **占位符扫描**：文件内容全量给出，无 TBD/TODO。
- **命名一致性**：`changelog-craft` / `CHANGELOG.md` / `Unreleased` / `Internal Changes` / `.bak` 规则在各 Task 间一致；format.md 模板中版本示例 `0.1.0` 与 Global Constraints 的技能版本号语义不同（前者是模板占位），已在模板语境中自明。
