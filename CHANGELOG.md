# Changelog

本项目的所有显著变更都将记录在本文件。格式基于 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Added

- 新增 **changelog-craft** 技能：按 Keep a Changelog 1.1.0 规范维护 CHANGELOG.md，提交时逐笔判定改动是否值得写一条，发版时把 Unreleased 归段成新版本（[a250c5b]）
- 新增 **readme-banner** 技能：为 README 顶部生成 banner / hero 图，支持 LLM 直接写 SVG 或图像 AI 出图再矢量化，两种路径也可各出 3 张候选对比（[76a5c50]）
- 新增 **article-valuator** 技能：输入文章链接（自动抓取正文，含微信公众号反爬兜底）或粘贴文本，按深度、可操作性、新颖度、相关性四维打分，给出 10 分制阅读结论（[aa4ec87]）
- 整个仓库可作为一个 **ZCode 插件市场**添加，四个技能均可按插件独立安装（[2033e0d]）
- readme-craft 支持**多语言 README**：默认多选询问目标语言，主语言之外生成 `README.<bcp47>.md`，附翻译规则（标题 key 默认不译、徽章 URL 不译等）（[e0744da]）

### Changed

- **readme-craft 0.2.0**：新增 git tag 感知——仓库没有任何 tag 时询问是否创建（绝不自动推送），version 徽章优先用 GitHub 动态端点避免过期；写 README 时默认依据项目自动生成一张顶部 SVG banner（[677d628]）

### Fixed

- 按安全评估结果修复 readme-craft 与 article-valuator 两个技能的安全漏洞、逻辑矛盾与文档渲染损坏问题（[0e971a4]）

### Internal Changes

- changelog-craft 的设计文档、评审修订与实施计划入库（[15a072a]、[0b993ce]、[b788a93]）

[Unreleased]: https://github.com/uwakeme/wake-skills/compare/8fcc7d3...HEAD
[a250c5b]: https://github.com/uwakeme/wake-skills/commit/a250c5b
[76a5c50]: https://github.com/uwakeme/wake-skills/commit/76a5c50
[aa4ec87]: https://github.com/uwakeme/wake-skills/commit/aa4ec87
[2033e0d]: https://github.com/uwakeme/wake-skills/commit/2033e0d
[e0744da]: https://github.com/uwakeme/wake-skills/commit/e0744da
[677d628]: https://github.com/uwakeme/wake-skills/commit/677d628
[0e971a4]: https://github.com/uwakeme/wake-skills/commit/0e971a4
[15a072a]: https://github.com/uwakeme/wake-skills/commit/15a072a
[0b993ce]: https://github.com/uwakeme/wake-skills/commit/0b993ce
[b788a93]: https://github.com/uwakeme/wake-skills/commit/b788a93
