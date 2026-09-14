# changelog-craft 设计文档

- 日期：2026-09-15
- 状态：待用户评审
- 产物：新技能 `changelog-craft/`，加入 Wake-Skills 仓库与 ZCode 插件市场

## 1. 定位

从 git 历史生成符合 [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0)（[中文版](https://keepachangelog.com/zh-CN/1.1.0/)）规范、说人话的 `CHANGELOG.md`。项目门面三部曲的第三块：

| 职责 | 技能 |
| --- | --- |
| README 招牌 | readme-craft |
| banner 门面 | readme-banner |
| **CHANGELOG 履历** | **changelog-craft（本技能）** |

**纯写作边界**：不碰 tag 创建（readme-craft Step 1.6 的地盘）、不碰 GitHub Release 发布（官方 `github:release` 的地盘——本技能产出的最新版本段可直接粘给它用）、不自动 commit。

**触发词**：`生成 CHANGELOG`、`写 changelog`、`更新更新日志`、`整理 release notes`、`这个版本改了啥`。

**不用场景**：只想发布 Release；想连打 tag 一起管；生成 API 文档级别的变更清单（接口 diff 另有工具）。

## 2. 对 Keep a Changelog 1.1.0 的对齐点

URL 直接写进 SKILL.md（规范来源 + 深读链接，中英双语）。技能内固化以下约定（`references/format.md` 展开）：

| 约定 | 落地 |
| --- | --- |
| 文件名固定 `CHANGELOG.md`，放项目根 | 输出契约 |
| 顶部维护 `Unreleased` 段 | 发版时把段内条目挪进新版本段 |
| 版本标题 `[1.2.0] - 2026-09-15`（ISO 日期，倒序） | 模板硬规则 |
| 版本可链接：文件底部 reference-style 放 compare 链接 | 与 readme-craft 徽章引用区同一套家规 |
| 六大类：Added / Changed / Deprecated / Removed / Fixed / Security | 分组判定树（见 format.md） |
| 撤回的版本保留条目 + 响亮的 `[YANKED]` 标记 | 写进 format.md |
| 头部声明是否遵循 SemVer | 首次生成模板自带 intro |
| 日期一律 `YYYY-MM-DD` | 自检项 |
| 反模式：逐条搬运 commit log | 核心撰写规则（见 §4） |

## 3. Procedure（五步）

### Step 1 — 摸底

- `git tag` 列表 + 最新 tag；manifest（package.json 等）的 version
- 已有 `CHANGELOG.md` → 读出已覆盖到哪个版本、什么语言、什么分组风格
- 抽样最近 20 条提交，判断提交信息语言（中文仓库 entries 用中文写）

### Step 2 — 范围判定

| 情况 | 动作 |
| --- | --- |
| 已有 CHANGELOG | **只做增量**（上个 tag..HEAD），默认不碰历史段落 |
| 没有 CHANGELOG | 全量生成：按 tag 分段回溯全部历史；版本多于 10 个时问用户"全量还是只从某个版本起" |
| 无 tag 仓库 | 全部进 `Unreleased` 段，提示"打 tag 后可归段"（不代打） |

用户明确要求修正 / 补漏历史段落时可以改写（规范允许），**先备份**。

### Step 3 — 素材归类

- `git log <range> --oneline` 拿候选条目，按六大类分组
- Merge commit、`chore`、typo 级噪音默认丢弃或归 `Internal Changes`
- 提交信息看不出用户价值的：看 diff / 文件路径推断；仍判断不了的**合并为一句话**，实在不行兜底问用户一次 highlights（一次问完，不逐条追问）

### Step 4 — 撰写

- **每条 entry 写"使用者可感知的变化"，不是复述 commit message**——规范反模式第一条就是 commit log dump（`fix bug` → 修了什么、影响谁）
- 面向使用者写，不面向协作者写：纯内部重构归 `Internal Changes` 一笔带过
- 条目带 short-hash 链接（复用文件底部引用区）
- 反 AI 味沿用 readme-craft 口径：破折号节制、不堆形容词、每条是完整的句子

### Step 5 — 自检写入

- [ ] 版本号与 tag / manifest 一致（只读，不猜 semver、不建议升版本）
- [ ] Merge / release 前缀已清洗、日期 `YYYY-MM-DD`、倒序排列
- [ ] 六大类名称未翻译混用（同文件内统一）
- [ ] 无占位符、链接有效
- 已有文件先备份（`.bak` 已存在改用时间戳名，不覆盖旧备份——readme-craft 同款规则）

## 4. 语言策略

单语言，跟随主 README 的语言（读 `README.md` 判断；读不出就问一次）。**不做多语言 CHANGELOG**——多语言是 readme-craft 的事，日志文件不需要。

## 5. 非目标（YAGNI）

- monorepo 按 package 拆分日志
- semver 升版建议
- 自动 commit / 自动发布 / 自动打 tag
- 多语言版本

## 6. 文件结构与自包含

```
changelog-craft/
├── .claude-plugin/plugin.json
├── SKILL.md              # 定位、触发、五步流程、边界
└── references/
    └── format.md         # 1.1.0 规范要点 + 分组判定树 + 模板 + 反例
```

references **自包含**（不跨插件引用），但 SKILL.md 与 format.md 顶部都注明规范出处 URL（中英双语）——用户明确要求。

## 7. 市场与仓库登记

- `changelog-craft/.claude-plugin/plugin.json`（版本 0.1.0）
- `.claude-plugin/marketplace.json` 注册（中英双语 description）
- 仓库 `README.md`「当前 skill」一节登记

## 8. 验证方式

技能写完后拿 **Wake-Skills 仓库自己**试跑（零 tag、无 CHANGELOG、提交历史完整——正好覆盖"无 tag 全进 Unreleased"和"全量回溯"两条路径），效果由用户目检。
