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
