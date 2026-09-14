# changelog-craft 设计文档

- 日期：2026-09-15（评审修订 v2：新增逐笔模式）
- 状态：待用户评审
- 产物：新技能 `changelog-craft/`，加入 Wake-Skills 仓库与 ZCode 插件市场

## 1. 定位

维护一份符合 [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0)（[中文版](https://keepachangelog.com/zh-CN/1.1.0/)）规范、说人话的 `CHANGELOG.md`。**两阶段维护**：

| 模式 | 时机 | 动作 |
| --- | --- | --- |
| **A 逐笔模式（核心）** | 每次 commit 时 | 检查本次改动是否值得写一条，值得就追加进 `Unreleased` 段并**随本次 commit 一起提交** |
| **B 成段模式（兜底）** | 发版时 | 把 `Unreleased` 归段成新版本；对照 git log 补漏逐笔模式漏掉的条目 |

两阶段配合的道理：逐笔时上下文最全（diff 还热着），漏写不可找回，所以**判定从宽**；成段时是策展，可以把 Unreleased 阶段多写的删掉、措辞收紧。Unreleased 段正是规范为此设计的。

**纯写作边界**：不碰 tag 创建（readme-craft Step 1.6 的地盘）、不碰 GitHub Release 发布（官方 `github:release` 的地盘——最新版本段可直接粘给它用）、不自动 commit（逐笔模式是把 CHANGELOG.md **加入**用户已确认的那次 commit，不另起提交）。

**触发词**：`生成 CHANGELOG`、`写 changelog`、`更新更新日志`、`这个版本改了啥`、`整理 release notes`，以及**提交意图**——`提交`、`commit`、`帮我提交这些改动`（命中即先过 §3 判定规则，再走正常提交流程）。

**不用场景**：只想发布 Release；连打 tag 一起管；生成 API 级接口 diff 清单。

## 2. 对 Keep a Changelog 1.1.0 的对齐点

URL 写进 SKILL.md 与 `references/format.md` 顶部（中英双语，规范来源 + 深读）。技能内固化：

| 约定 | 落地 |
| --- | --- |
| 文件名固定 `CHANGELOG.md`，放项目根 | 输出契约 |
| 顶部维护 `Unreleased` 段 | 逐笔模式的落点；成段模式把它归段成新版本 |
| 版本标题 `[1.2.0] - 2026-09-15`（ISO 日期，倒序） | 模板硬规则 |
| 版本可链接：文件底部 reference-style 放 compare 链接 | 与 readme-craft 徽章引用区同一套家规 |
| 六大类：Added / Changed / Deprecated / Removed / Fixed / Security | 分组判定树（format.md） |
| 撤回版本保留条目 + 响亮的 `[YANKED]` | 写进 format.md |
| 头部声明是否遵循 SemVer | 首次初始化模板自带 intro |
| 日期一律 `YYYY-MM-DD` | 自检项 |
| 反模式：逐条搬运 commit log | 两个模式共同的核心撰写规则 |

## 3. 逐笔模式：值不值得写一条（判定规则）

**先判定，再决定动不动 CHANGELOG**。判定基于 staged diff（未 stage 就先看工作区改动）：

| 变化 | 动作 |
| --- | --- |
| 新功能、既有行为变化、bug 修复、废弃、移除、安全问题 | **写**，归入对应大类 |
| 可感知的性能改善、有行为影响的依赖升级 | 写 |
| 纯重构、CI / 构建、内部测试、typo、纯文档改动 | 不写，明确说"本次无可写条目"，不追问 |
| 拿不准 | **写进 Unreleased 并在报告里注明**——逐笔时漏写不可找回，多写在成段时可删；宁滥勿缺 |

**流程**：

1. 判定 → 无条目：报告一句"无可写条目"，结束（默认不吵）
2. 有条目 → 按 Step 4 撰写规则起草 1-3 条，追加进 `Unreleased` 段对应大类
3. 项目还没有 `CHANGELOG.md` → 问一次"要初始化吗"（初始化 = 规范骨架 + SemVer 声明 + 本次条目；**不**主动全量回溯历史，用户要才转成段模式全量）
4. `CHANGELOG.md` 加入本次 commit 的 staged 文件一起提交；报告写了哪些条目

**触发机制（诚实声明）**：技能是提示层约定——靠触发词命中提交意图 + 建议用户在常维护项目的 `AGENTS.md` / `CLAUDE.md` 加一行"commit 前按 changelog-craft 检查"。git hook 硬自动化**不在本技能范围**（跨平台安装与 Agent 调用复杂，收益不成比例）。

## 4. 成段模式（发版时）

原五步流程，素材来源调整：

### Step 1 — 摸底

git tag 列表 + manifest version + 已有 CHANGELOG 覆盖到哪个版本 / 什么语言 / 分组风格；抽样提交判断语言习惯（中文仓库 entries 用中文写）。

### Step 2 — 范围判定

| 情况 | 动作 |
| --- | --- |
| 已有 CHANGELOG，Unreleased 有条目 | 归段：`Unreleased` → 新版本段，补日期和 compare 链接 |
| 已有 CHANGELOG，Unreleased 空 | 对照 git log（上个 tag..HEAD）补漏——逐笔模式可能被跳过过 |
| 没有 CHANGELOG | 全量生成：按 tag 分段回溯；版本 > 10 个时问"全量还是从某个版本起" |
| 无 tag 仓库 | 全部进 `Unreleased`，提示"打 tag 后可归段"（不代打） |

用户明确要求修正 / 补漏历史段落时可以改写（规范允许），**先备份**。

### Step 3 — 素材归类

Unreleased 现有条目为主；git log 兜底补漏时按六大类分组，Merge / chore / typo 噪音丢弃或归 `Internal Changes`；看不出用户价值的看 diff 推断，仍不行合并成一句，兜底问一次 highlights（一次问完，不逐条追问）。

### Step 4 — 撰写（两模式共用）

- **每条 entry 写"使用者可感知的变化"，不复述 commit message**（规范反模式第一条 commit log dump；`fix bug` → 修了什么、影响谁）
- 面向使用者写，不面向协作者写：纯内部重构归 `Internal Changes` 一笔带过
- 条目带 short-hash 链接（文件底部引用区）
- 反 AI 味沿用 readme-craft 口径：破折号节制、不堆形容词、完整句子

### Step 5 — 自检写入

- [ ] 版本号与 tag / manifest 一致（只读，不猜 semver、不建议升版本）
- [ ] Merge / release 前缀已清洗、日期 `YYYY-MM-DD`、倒序排列
- [ ] 六大类名称同文件内统一（不中英混用）
- [ ] 无占位符、链接有效
- 已有文件先备份（`.bak` 已存在改用时间戳名，不覆盖旧备份——readme-craft 同款规则）

## 5. 语言策略

单语言，跟随主 README 的语言（读 `README.md` 判断；读不出问一次）。**不做多语言 CHANGELOG**。

## 6. 非目标（YAGNI）

- git hook 自动化（提示层约定 + AGENTS.md 提示行已够用）
- monorepo 按 package 拆分日志
- semver 升版建议
- 自动 commit / 自动发布 / 自动打 tag
- 多语言版本

## 7. 文件结构与自包含

```
changelog-craft/
├── .claude-plugin/plugin.json
├── SKILL.md              # 定位、双模式流程、判定规则、边界
└── references/
    └── format.md         # 1.1.0 规范要点 + 分组判定树 + 初始化模板 + 反例
```

references **自包含**（不跨插件引用）；SKILL.md 与 format.md 顶部注明规范出处 URL（中英双语）。

## 8. 市场与仓库登记

- `changelog-craft/.claude-plugin/plugin.json`（版本 0.1.0）
- `.claude-plugin/marketplace.json` 注册（中英双语 description）
- 仓库 `README.md`「当前 skill」一节登记

## 9. 验证方式

1. **逐笔模式**：在 Wake-Skills 自己仓库做一次带用户可感知变化的模拟改动 → commit，验证判定与 Unreleased 追加、同 commit 提交
2. **成段模式**：同仓库全量回溯（零 tag、无 CHANGELOG、提交历史完整——覆盖"无 tag 全进 Unreleased"与"全量回溯"路径）
3. 效果由用户目检
