# Changelog

本项目的所有显著变更都将记录在本文件。格式基于 [Keep a Changelog 1.1.0](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### Changed

- **homepage-craft 0.3.0**：新增 Step 8「回填主页地址」——部署上线后可选把公开地址回填进项目：① README 挂一行链接（位置优先挂在 H1 下方的徽章行，带 `<!-- homepage-craft:homepage -->` 不可见标记，重跑原地更新不重复插）；② 设置仓库 Website 字段（`gh repo edit --homepage`，写完回读校验）。两项分开让用户勾选，仓库 Website 字段已有别的地址时停下问用户而不是覆盖；公开地址改以 Pages API 的 `html_url` 为准——账号级或仓库级自定义域名下拼 `https://<user>.github.io/<repo>/` 是打不开的

## [0.3.0] - 2026-11-17

### Added

- 新增 **AGENTS.md**：本仓库的 agent 操作约定（直接在 `main` 上开发、数据单一来源、触发词格式、LF 行尾）
- 主页与 README 的 skill 列表改为**从 `.claude-plugin/marketplace.json` 自动生成**——新增或修改 skill 后不再手工编辑主页，列表、详情、分类筛选、meta 数字与 README 的版本号/触发词行全部由 `npm run build` 产出（`d94418b`、`e59e4f7`、`48308eb`、`22af90b`）
- 新增 `npm run check` 漂移检测：改完 skill 忘了 build 会退出码 1，避免主页数字与真实数据脱节（`e8fe683`）
- 新增 `.githooks/pre-commit`：暂存内容命中 `SKILL.md` / `marketplace.json` / `scripts/` 时自动同步生成物，build 失败则阻止提交（`b36d3f2`）
- 新增 **homepage-craft** 技能：扫描仓库产出单文件 HTML 主页（`docs/index.html`，可直接发布到 GitHub Pages），自动编排已安装的设计类 skill（frontend-design / ui-ux-pro-max / superdesign），生成后可经用户确认自动部署（commit + push + gh 开启 Pages）（[bb111e6]）
- homepage-craft 首次 dogfood：为本仓库生成主页 `docs/index.html`（墨蓝夜编辑器风、frontmatter 卡签名元素，桌面 + 手机双宽度自检通过）（[7c9b33e]）
- 新增 **review-brief** 技能：改动收尾时生成自包含的审查简报——原始需求与验收标准、变更范围（未提交变更或提交区间）、按需求符合性 / 潜在 bug / 影响面拆好的审查要点，交给另一个没有对话上下文的 agent 独立复查（[086c678]）
- README 顶部新增手写 SVG banner（`assets/banner.svg`）：文字居中、去掉圆圈图案，改用两条斜向柔光带缓慢漂移 + 四角直角括号错峰呼吸；配色沿用主页（`#141a24` 底 + 琥珀 `#e9a15a` + 青 `#63c7b8`）。动画写在 SVG 内的 CSS 里（GitHub 只清洗 `<script>`，保留 `<style>` 与 keyframes），同时给不播放动画的阅读器准备完整静态首帧，并按 `prefers-reduced-motion` 降级（[5b16411]）
- AGENTS.md 补上**视觉素材口径**：README 顶部 banner 文字居中、不用圆圈图案、周围加克制的动效，配色沿用主页设计系统；并写明这条口味**只对本仓库成立**，别照搬到别的项目（[49ea9ed]）
- **readme-craft 0.3.0**：新增 Step 4.6「界面截图」——仅 web-app / tutorial 触发，agent 自己拉起 dev server、驱动浏览器渲染真实界面，出多张候选交用户挑，选中的落进 `assets/screenshots/` 并嵌入 README 的 Screenshots 章节；内置浏览器视口固定（移动端候选走无头 Chrome），截图失败不阻塞 README 主流程（[1ff6a5c]）
- 新增 **CI**（`.github/workflows/ci.yml`）：push / PR 到 `main` 自动跑 `npm run lint`、`npm run check`、`npm test`；仓库零依赖，无需安装步骤
- 主页 skill 详情支持**深链**：`#<skill-name>` 直接展开对应详情，展开 / 收起同步改写 hash，并监听 `hashchange` 支持浏览器前进后退
- 新增 `npm run lint`：校验各 skill 的 SKILL.md frontmatter、plugin.json 与 marketplace.json 是否一致，触发词来源为 `none` 时报错退出
- 集合版本改为**单一来源**：`.claude-plugin/marketplace.json` 顶层 `version`，build 把版本号注入主页首屏 eyebrow 与仓库名片

### Changed

- **readme-banner 0.2.0**：新增动效产出能力——产物分静态与带 CSS 动画两种形态，动效走 SVG 内嵌 `@keyframes`（GitHub README 实测会播，不播的环境首帧仍是完整可用的图）；生成前用一次问卷问清「生成几张」与「全静态 / 全动态 / 混合」，混合时按对位交替分配候选；图像 AI 路径新增「底图 + 动效层」组合。新增 `references/motion.md` 收录动效规范、svgo 安全配置（默认配置会静默丢掉降级规则与 `role="img"`）与确定性定帧验证方法（[5432c34]）
- **review-brief 0.2.2**：生成后的回复附一段可直接复制给审查 agent 的 prompt（填好简报路径、变更范围、仓库与环境假设）——用户复制即可转交，读不到文件时再附简报正文与 patch；同步补自检项、Output contract 与示例（[78dfcf8]）
- **review-brief 0.2.1**：长任务先回查会话最早的原始消息再总结需求——压缩摘要只当索引、不冒充用户原话；原始消息不可得时标注来源与不确定性，并新增对应的自检项、失败处理与示例（[7c9d676]）
- **review-brief 0.2.0**：补齐交接缺口——新增 bug / 问题背景（现象、复现、期望 vs 实际、根因、修复思路）、实现方自测记录与需求覆盖情况；提交表补日期并处理区间内无关提交、工作区无关改动与未配置远端的情况；写明审查方环境与变更获取方式（同工作区 / clone / patch）及审查前状态核对要求；修正「空节不删」与局限性节自相矛盾，明确 `review-briefs/` 是未跟踪交接物、不计入审查范围（[5a6ea49]）
- 主页 skill 列表从 5 段硬编码 HTML 改为运行时渲染：点击卡片展开详情（完整描述、触发词、不适用场景、references 清单、可一键复制的安装命令），并支持按分类筛选（`e59e4f7`）
- **homepage-craft 0.2.0**：部署流程改为两段询问（部署意向 + 发布策略），发布策略由用户决定——随 main 分支 + `/docs` 同提交同步，或把发布拷贝隔离到独立 `gh-pages` 分支（git worktree 操作、不碰工作区）；"Pages 已开启且源不同"安全阀覆盖 A/B 互切（[770efec]）
- 主页字体改为**内联**：Zilla Slab 与 JetBrains Mono 的 latin 子集转 base64 `@font-face`，去掉 Google Fonts 外链，保住单文件 + 零 CDN（中文仍走系统字）
- 主页补 `noscript` 降级：禁用 JS 时静态章节照常可见，并提示技能列表需要 JS、附仓库链接
- 分类筛选改为**原地更新** `aria-pressed`，不再重建 chip 节点——键盘用户每按一次回车焦点不再掉回 body
- 复制按钮统一走事件委托，clipboard 被拒时回落 `execCommand`，仍失败如实显示「复制失败」，不谎报已复制
- `.githooks/pre-commit` 扩大触发面（命中 `package.json` / `test/` 也同步），并在生成物有未暂存改动时告警，避免整文件 `git add` 扫进手写内容
- README 的 readme-craft 段落补上多语言 README 说明（主 README 之外按 BCP-47 生成 `README.<lang>.md`，`i18n.md` 管翻译规则）
- article-valuator / changelog-craft / readme-banner 的 plugin.json 描述与 marketplace 对齐（readme-banner 由中文改英文）

### Fixed

- 修复主页首屏 eyebrow 与仓库名片上的技能数量只由前端 JS 运行时改写、构建期不更新的问题：新增 `injectHeroCount` 定点注入，`--check` 现在能检测这两处的漂移（`22af90b`）
- 修复 README 注入会把触发词里的 `$&` / `$1` 当替换模式、导致手写描述段落被复制篡改的隐患，注入改为函数式替换（`e8fe683`）
- 修复触发词解析用「数量上限」判定散文，误伤 changelog-craft 与 homepage-craft 共 6 条真实触发词；改为按句号边界切分（`8559bd8`）
- 测试里的技能数量断言改为从 marketplace.json 与主页内联数据推导，新增 skill 不再把测试弄红（`5658824`）
- 新增 `.gitattributes` 统一 LF 行尾，修复 Windows `core.autocrlf=true` 下 `--check` 首次运行必报伪漂移（`e8fe683`）
- 触发词解析支持**弯引号**（`“”`）与直角引号（`「」`）：此前只认 ASCII 直引号，弯引号包裹的触发词整段漏解析
- 反触发词改按**最后一个** `→` 切分解释段：条目本身含箭头（如「仓库 → 主页」）时不再被截成残句
- `skills.json` 的 `repo` 字段改用真实 git remote 推导，不再写死 fallback 用户名 / 仓库名
- `extractTriggersFromReadme` 对 skill 名做正则转义，名字含正则元字符时不再误匹配
- 补齐 CHANGELOG 缺失的 commit 链接定义（`5b16411`、`49ea9ed`、`1ff6a5c`），非标准的「Internal Changes」归入 Keep a Changelog 标准分类

### Removed

- `docs/superpowers/` 内部设计文档撤下公开跟踪（`.gitignore` 忽略 + `git rm --cached`，本地文件保留），不再随 GitHub Pages 发布

## [0.2.0] - 2026-09-23

### Added

- 新增 **changelog-craft** 技能：按 Keep a Changelog 1.1.0 规范维护 CHANGELOG.md，提交时逐笔判定改动是否值得写一条，发版时把 Unreleased 归段成新版本（[a250c5b]）
- 新增 **readme-banner** 技能：为 README 顶部生成 banner / hero 图，支持 LLM 直接写 SVG 或图像 AI 出图再矢量化，两种路径也可各出 3 张候选对比（[76a5c50]）
- 新增 **article-valuator** 技能：输入文章链接（自动抓取正文，含微信公众号反爬兜底）或粘贴文本，按深度、可操作性、新颖度、相关性四维打分，给出 10 分制阅读结论（[aa4ec87]）
- 整个仓库可作为一个 **ZCode 插件市场**添加，四个技能均可按插件独立安装（[2033e0d]）
- readme-craft 支持**多语言 README**：默认多选询问目标语言，主语言之外生成 `README.<bcp47>.md`，附翻译规则（标题 key 默认不译、徽章 URL 不译等）（[e0744da]）
- changelog-craft 的设计文档、评审修订与实施计划入库（[15a072a]、[0b993ce]、[b788a93]）

### Changed

- **readme-craft 0.2.0**：新增 git tag 感知——仓库没有任何 tag 时询问是否创建（绝不自动推送），version 徽章优先用 GitHub 动态端点避免过期；写 README 时默认依据项目自动生成一张顶部 SVG banner（[677d628]）
- **readme-craft 0.2.1**：生成的 README 不再每个 section 都挂 back-to-top——只在一屏放不下的长大节末尾保留，License / Authors / Contact 等收尾小节与文档末尾一律不加（[5212ddd]）

### Fixed

- 按安全评估结果修复 readme-craft 与 article-valuator 两个技能的安全漏洞、逻辑矛盾与文档渲染损坏问题（[0e971a4]）

[Unreleased]: https://github.com/uwakeme/wake-skills/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/uwakeme/wake-skills/releases/tag/v0.3.0
[0.2.0]: https://github.com/uwakeme/wake-skills/releases/tag/v0.2.0
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
[5212ddd]: https://github.com/uwakeme/wake-skills/commit/5212ddd
[bb111e6]: https://github.com/uwakeme/wake-skills/commit/bb111e6
[7c9b33e]: https://github.com/uwakeme/wake-skills/commit/7c9b33e
[770efec]: https://github.com/uwakeme/wake-skills/commit/770efec
[086c678]: https://github.com/uwakeme/wake-skills/commit/086c678
[5a6ea49]: https://github.com/uwakeme/wake-skills/commit/5a6ea49
[7c9d676]: https://github.com/uwakeme/wake-skills/commit/7c9d676
[78dfcf8]: https://github.com/uwakeme/wake-skills/commit/78dfcf8
[5b16411]: https://github.com/uwakeme/wake-skills/commit/5b16411
[49ea9ed]: https://github.com/uwakeme/wake-skills/commit/49ea9ed
[1ff6a5c]: https://github.com/uwakeme/wake-skills/commit/1ff6a5c
[5432c34]: https://github.com/uwakeme/wake-skills/commit/5432c34