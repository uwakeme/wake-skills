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
