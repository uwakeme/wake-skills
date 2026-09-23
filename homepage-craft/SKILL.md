---
name: homepage-craft
description: |
  为开源项目生成优美的主页：扫描仓库（manifest、README、截图、git 元信息），
  产出一个可直接发布到 GitHub Pages 的单文件 HTML landing page（docs/index.html）。
  自动探测并编排已安装的设计类 skill（frontend-design / ui-ux-pro-max / superdesign）
  提升视觉质量——ui-ux-pro-max 出设计系统，frontend-design 管实现美感；
  一个都没装时退回内置设计基线（references/design-baseline.md），不阻塞主流程。
  生成后可选自动部署到 GitHub Pages（commit + push + gh 开启 Pages），先询问再动手。

  触发："给项目生成主页"、"做一个 landing page"、"生成项目官网"、"GitHub Pages 首页"、
  "project homepage"、"把 README 变成网页"、"开源项目展示页"、"给我的库做个介绍页"、
  "把主页部署上线"（配合已生成的主页）。

  不要在以下情况使用：
  - 要写 / 改 README.md 本身（Markdown 文档，不是网页）→ 用 readme-craft（如已安装）
  - 只要一张 README 顶部 banner 图 → 用 readme-banner（如已安装）
  - 通用前端开发或任意 UI 设计（不是"仓库 → 主页"这条流水线）→ 直接用 frontend-design 等设计 skill
  - 项目已有 VitePress / Docusaurus / MkDocs 文档站，且用户想往文档站里加页 → 按该框架惯例写
risk: safe
source: "self-authored"
---

# homepage-craft

把一个开源仓库变成一页拿得出手的主页：素材全部来自仓库本身（README、manifest、截图、git 元信息），产物是一个单文件 HTML，双击能开、推到 GitHub Pages 就能发布。视觉质量优先借力环境里已装的设计类 skill，本 skill 负责的是"仓库 → 内容 → 页面"这条流水线和发布可用性。

## 设计原则（贯穿整个 procedure）

| 原则 | 含义 | 反例 |
| --- | --- | --- |
| **内容真实** | 页面上一切事实（功能、数字、链接、截图）都来自仓库素材，拿不到的就不写 | 编造 "10k+ users"、放 stock 占位图、写仓库里不存在的功能 |
| **单文件零构建** | 一个 `index.html` 装下全部 CSS/JS，无 npm、无构建步骤，file:// 直接打开 | 产物需要 `npm install && build` 才能看 |
| **美感有出处** | 设计决策来自 companion skill 或内置基线，并在报告里说明用了哪条路径 | 不声明来源地随手套一个紫色渐变模板 |
| **发布即可用** | OG meta、favicon、JSON-LD、相对路径全配齐，推到 GitHub Pages 就是完成态 | 分享出去没有社交预览卡片；图片路径出了 docs/ 就 404 |

风格基线：**像一个头部开源项目的官网，不是像模板市场的 demo 页。**

---

## Inputs to collect

按需读取，不需要全部问用户：

- **项目路径**：默认当前工作目录；用户给 GitHub URL 时走远程模式（见 Step 2）
- **输出位置**：默认 `<project-root>/docs/index.html`（GitHub Pages 的 /docs 源约定）；`docs/` 被文档框架占用时改用 `homepage/index.html`（见 Failure handling）
- **页面语言**：默认跟随主 README 的语言，不问；用户指定了其他语言按用户的来
- **风格偏好**（可选）：用户主动说了（"暗色"、"极简"）就记录；没说且有 companion 设计 skill 时交给它决定；两者都没有时，从基线三方向里按项目类型选，不追问（见 Step 3）
- **部署意向**：不预设、不提前问——Step 7 生成完毕后再询问；用户一开始就明确说"部署到 GitHub Pages"的，Step 7 免询问直接走

---

## Procedure

### Step 1 — 扫描项目，收集素材

读取根目录列表和关键 manifest，确定 name、version、description、license、homepage/repository 字段。manifest 类型对照表与 readme-craft 一致（package.json / pyproject.toml / go.mod / Cargo.toml / pom.xml / Gemfile / composer.json / *.csproj）。

**git 元信息**（只读命令）：

```bash
git rev-parse --is-inside-work-tree   # 是否 git 仓库
git remote get-url origin             # 提取 <user>/<repo>，供仓库链接和 star 数用
git describe --tags --abbrev=0        # 最新 tag（供 version 展示）
```

**视觉素材扫描**（按优先级找，命中即记录路径）：

| 素材 | 常见位置 |
| --- | --- |
| logo / favicon | `logo.*`、`assets/`、`docs/`、`.github/`、`public/` |
| 截图 / demo GIF | README 里引用的图片、`docs/images/`、`screenshots/`、`.github/assets/` |
| 已有主页 | `index.html`、`docs/index.html`、`_config.yml`（Jekyll）、`docusaurus.config.*`、`mkdocs.yml` |

- README 里引用的图片**一定真实存在才可用**——引用前先验证文件在磁盘上（远程图片验证 URL 可达）
- 发现已有文档站配置（VitePress / Docusaurus / MkDocs / Jekyll）→ 记录下来，Step 6 决定输出位置时要避让

> 这是必做步骤——不读仓库就在主页上写功能介绍，几乎一定会编造。

### Step 2 — 提取页面内容

从 README + manifest + git 信息整理一份**内容清单**，页面上只允许出现清单里的东西：

| 内容项 | 来源 | 缺失时 |
| --- | --- | --- |
| 项目名 | manifest `name` → 目录名 | 问用户，不猜 |
| tagline | manifest `description` → README 首段 | 从 README 提炼一句，不编营销话术 |
| 核心功能 3–6 条 | README 的 Features 章节 | 从 Usage / API 章节归纳 |
| 安装命令 | README Installation / Quick Start | 按包管理器和 manifest 推断，标注"推断值" |
| 最小用法示例 | README Usage 代码块 | 没有就不放代码区，不手写伪示例 |
| 截图 ≤ 4 张 | Step 1 扫到的真实图片 | 全没有 → 纯 CSS/SVG hero，绝不放占位图 |
| 链接组 | repo、文档站、demo、包注册表（npm/PyPI/crates）、Releases | 只放真实存在的 |
| 数字（stars/version/license） | git tag、GitHub API、manifest | 拿不到就不展示，不留 `xxx` 占位 |

**语言**：跟随主 README（多语言 README 时跟随第一个/默认那个）。README 是中文就出中文页，英文就出英文页——主页和 README 语言打架是最常见的违和感来源。

**措辞**：把 README 的事实重写成页面语言（短句、动词开头、面向访客），但不添加 README 里没有的承诺。AI 上下文文件（AGENTS.md / CLAUDE.md）可以参考作者语气，敏感信息一律丢弃。

**远程模式**（用户给的是 GitHub URL 而非本地路径）：

1. 拉 `https://raw.githubusercontent.com/<user>/<repo>/HEAD/README.md`（失败依次试 main / master）
2. 拉 `https://api.github.com/repos/<user>/<repo>`（stars、license、topics、homepage 字段；未认证限流失败就跳过，相应内容不展示）
3. 图片一律用 raw.githubusercontent 绝对 URL（本地没有文件可拷）
4. 产物写到当前目录 `<repo>-homepage/index.html`，报告里说明"可整体拷入目标仓库 docs/ 发布"

### Step 3 — 设计系统：探测并编排 companion skill

这是视觉质量的关键一步。检查**本 session 的可用 skill 列表**（系统会注入 available skills；名字可能带插件命名空间前缀，如 `frontend-design:frontend-design`，按去掉前缀后的基础名匹配）：

| companion skill | 职责 | 命中后动作 |
| --- | --- | --- |
| **ui-ux-pro-max** | 出设计系统：风格、配色、字体搭配、landing 版式模式 | 用 Skill 工具加载，按它的流程为"开源项目主页"生成设计系统建议，把结果作为 Step 4 的 tokens 输入 |
| **frontend-design** | 管实现美感：写 HTML/CSS 时的美学决策与工艺标准 | 写页面前用 Skill 工具加载，Step 4 全程遵循其指导 |
| **superdesign** | 整页设计判断 | 同 frontend-design 的用法 |
| **都没装** | 内置基线兜底 | 读 `references/design-baseline.md`，按项目类型选风格方向 |

**组合规则**：

- ui-ux-pro-max 和 frontend-design **同时命中就同时用**——前者决定"长什么样"（design tokens + 章节建议），后者管"怎么写得好看"（实现时的排版、层次、细节工艺），职责不冲突
- 同类多个命中（frontend-design 和 superdesign 都装了）取一个即可，优先 frontend-design
- 环境没有 Skill 工具时，退回按常见安装路径直接读它的 SKILL.md 并遵循（`~/.agents/skills/`、`~/.claude/skills/`、插件缓存目录）
- companion skill 加载失败或执行报错 → 降级到内置基线，报告里说明原因，**不阻塞主流程**

**记录美感来源**（companion 名称 + 它给的关键决策，或基线方向 A/B/C），Step 6 报告要用。

### Step 4 — 生成单文件 HTML

按 Step 3 的设计系统和 Step 2 的内容清单写页面。章节选择、HTML 骨架、必备 meta、复制按钮等具体规范见 **`references/page-anatomy.md`**；走内置基线时的风格方向和反模板化规则见 **`references/design-baseline.md`**。

硬约束（无论美感来源是哪条路径都适用）：

- 单文件：CSS 内联 `<style>`，JS 只允许少量原生脚本（复制按钮、平滑滚动、滚动渐显），无框架无构建
- 外部依赖最多一项：Google Fonts（必须带系统字体 fallback，断网时页面不塌）
- 响应式：375px / 768px / 1440px 三档不破版；图片 `max-width: 100%`
- `<head>` 配齐：title、description、OG + Twitter card、内联 SVG favicon（data URI）、JSON-LD（SoftwareApplication）
- 安装命令区块带一键复制按钮
- 动效克制：只用 CSS transition，尊重 `prefers-reduced-motion`；不写视差滚动、粒子背景这类重 JS 效果
- 图片路径：拷进 `docs/assets/` 用相对路径，或用 raw.githubusercontent 绝对 URL——GitHub Pages 从 docs/ 发布时 `../assets/x.png` 是 404

> 页面好不好，七成在"少即是多"：章节宁少勿滥，每屏一个视觉重点。companion skill 给的建议和硬约束冲突时，以硬约束为准（它们是发布可用性的底线）。

### Step 5 — 视觉自检

**有浏览器工具**（browser-use / web-gui-tester 等，检查本 session 可用工具）：

1. 打开 `file:///<绝对路径>/index.html` 截图
2. 检查：hero 区完整、无横向滚动条、图片全部加载、复制按钮点击生效、无占位文本残留
3. 把视口缩到手机宽度（约 390px）再截一张，确认不破版
4. 发现问题回 Step 4 修，修完复检

**无浏览器工具**：按 `references/page-anatomy.md` 末尾的自检清单逐项过——grep 占位符残留（`TODO`、`xxx`、`YOUR-`、`lorem`）、核对引用的资源路径真实存在、检查标签配对。

### Step 6 — 写入并报告

1. **输出位置**：默认 `<project-root>/docs/index.html`；`docs/` 被文档框架占用（Step 1 检出 mkdocs.yml / docusaurus.config.* 等且 docs/ 是其内容目录）→ 写 `homepage/index.html` 并在报告里说明
2. 已有同名文件 → 先备份 `<file>.bak`；`.bak` 已存在改用带时间戳的 `<file>.<YYYYMMDD-HHMMSS>.bak`，绝不覆盖旧备份
3. 页面引用的本地图片拷贝到 `docs/assets/`（与 index.html 同级），README 原引用不动
4. 输出报告：

   ```
   已生成主页: docs/index.html（X KB + assets/ N 张图）
   美感来源: <companion skill 名称及关键决策 | 内置基线方向 B（清爽编辑风）>
   章节: Hero / Features / Quick Start / Screenshots / Footer
   本地预览: python -m http.server -d docs 8000
   ```

5. **不静默 commit / push**——随即进入 Step 7 询问部署意向；用户拒绝部署时，在报告里补一句建议的提交说明和手动发布路径（GitHub → Settings → Pages → Source 选 /docs）

### Step 7 — 部署到 GitHub Pages（可选，先问后动手）

部署是外向操作（推代码、改仓库设置），**必须先询问**；只有用户在需求里明确说了"部署"、"发布上线"才免询问直接走。

**前置条件检测**（按顺序查，决定询问时给哪些选项）：

| 条件 | 检测方式 | 不满足时 |
| --- | --- | --- |
| 产物在 `docs/index.html` | Step 6 的实际输出位置 | 输出在 `homepage/`（docs 被文档框架占用）或远程模式 → 自动部署不适用，只给手动指引 |
| git 仓库且 remote 是 GitHub | Step 1 的 `git remote get-url origin` 提取出 `<user>/<repo>` | 非 git / 非 GitHub → 跳过自动部署；GitLab 等提示对应平台的 Pages 手动步骤 |
| `gh` CLI 已安装且已登录 | `gh auth status`（退出码非 0 即不满足） | 降级为"只 commit + push"，Pages 开关给网页操作路径 |

**询问**（优先用 `ask_user` 工具，环境没有该工具时在回复里列出选项问一次）：

```yaml
question: "主页已生成，要部署到 GitHub Pages 吗？"
options:
  - 自动部署（commit + push + 开启 Pages，推荐）
  - 只 commit + push（Pages 我自己在网页上开）
  - 不部署（文件我自己处理）
# gh 不可用时第一个选项换成"只 commit + push"，并说明原因
```

**自动部署流程**：

1. **commit**：只 `git add` 本次生成的文件（逐个列出 `docs/index.html`、`docs/assets/` 下实际拷贝的图片）——**绝不 `git add -A` / `git add .`**，用户工作区里其他未完成的改动不属于这次提交。提交说明风格跟随目标仓库已有提交（如 `docs: add project homepage`）
2. **push**：`git push origin <当前分支>`——绝不 `--force`、绝不自动 pull/rebase；被拒（落后远端、分支保护）就停下报告原因，由用户决定怎么处理
3. **开启 Pages**（gh api，先查再动，保证幂等）：

   ```bash
   gh api repos/<user>/<repo>/pages        # 200 = 已开启；404 = 未开启
   gh api repos/<user>/<repo>/pages -X POST -f 'source[branch]=<分支>' -f 'source[path]=/docs'
   ```

   - 未开启（404）→ POST 创建
   - 已开启且源就是 `<分支>` + `/docs` → 无需操作，push 完等构建即可
   - 已开启但**源不同**（如 gh-pages 分支、Jekyll 根目录站）→ **停下来问用户**——切换源会顶掉现有站点，不能替用户决定
4. **等构建**：`gh api repos/<user>/<repo>/pages/builds/latest --jq .status`，约 15 秒轮询一次，最多等 2 分钟；超时未 built 就先给 URL 并注明"构建中，稍后刷新"
5. **报告**：公开 URL（Pages 的 `html_url`，通常 `https://<user>.github.io/<repo>/`）、构建状态、commit hash；仓库已有自定义域名的沿用，不碰域名设置

**降级分支**：

- 用户选"只 commit + push"或 gh 不可用 → 执行第 1–2 步后给出网页开启路径：`Settings → Pages → Build and deployment → Source: Deploy from a branch → <分支> + /docs`
- 连 push 条件都不满足（无 remote、无写权限）→ 停在 commit，报告手动步骤
- 用户选"不部署" → 什么都不做，报告里给建议的提交说明

---

## Output contract

- 单文件 `docs/index.html`（远程模式为 `<repo>-homepage/index.html`），HTML 本体 ≤ 200KB，超出需在报告说明原因
- file:// 双击可开，推上 GitHub Pages（/docs 源）即发布完成态，无需任何构建
- OG / Twitter meta、favicon、JSON-LD 齐全；分享出去有社交预览卡片
- 页面内容 100% 来自仓库真实素材；拿不到的数据不展示、不留占位
- 375px / 768px / 1440px 三档响应式不破版
- 报告注明美感来源（哪个 companion skill 或哪条基线方向）
- 选择部署时：commit 只含本次生成的文件，push 成功后开启 Pages 并报告公开 URL；任何一步失败都停在原地说明原因——绝不 force push、绝不静默切换已有的 Pages 源、绝不动用户没让动的仓库设置

---

## Failure handling

| 情况 | 处理 |
| --- | --- |
| 推断不出项目名（无 manifest、目录名无意义） | 问用户，不猜 |
| 无 README 且无 manifest | 请用户给一句话介绍 + 安装方式，只出最小可行版（hero + quick start + 链接） |
| 非 git 仓库 | 跳过 stars / repo 链接 / tag，相关区块不展示 |
| 一张截图都没有 | 纯 CSS/SVG 构成 hero 视觉，绝不放 stock 图或占位图 |
| README 引用的图片文件实际不存在 | 该图不上页面；报告里列出失效引用 |
| `docs/` 被文档框架占用 | 写 `homepage/index.html`，报告说明发布方式改为对应框架或根目录 |
| 已有 `docs/index.html` | 备份后覆盖（时间戳规则同 Step 6），明确告知用户 |
| companion skill 命中但加载 / 执行失败 | 降级内置基线，报告说明，不追问不阻塞 |
| 远程模式 raw README 拉取失败 | 依次试 main / master 分支；都失败请用户粘贴 README |
| GitHub API 限流（未认证 60 次/时） | 跳过 stars 等动态数字，页面只放静态可得内容 |
| 用户要"多页官网 / Next.js 版主页" | 超出本 skill 边界：说明单文件定位，建议直接用 frontend-design 做通用前端开发 |
| 页面 HTML 超 200KB | 先查是否误把大图 base64 内联——图片改为文件引用；仍超则精简章节并说明 |
| 同意部署但 `gh` 未安装 / 未登录 | 降级为"只 commit + push"，附网页开启 Pages 的步骤，提示 `gh auth login` 可解锁全自动 |
| push 被拒（落后远端 / 分支保护） | 停下报告原因，不 force push、不自动 pull rebase，由用户处理 |
| 仓库已有 Pages 且源不同 | 询问后再决定，绝不静默切换（会顶掉现有站点） |
| remote 不是 GitHub（GitLab / 自建） | 跳过自动部署，给对应平台的 Pages 手动指引 |
| 产物不在 `docs/`（框架占用 / 远程模式） | 自动部署不适用，报告说明手动发布方式 |
| 工作区有用户未提交的其他改动 | 只 add 本次生成文件，绝不 `git add -A` / `git add .`；改动原样留在工作区 |
| Pages 构建超时（> 2 分钟） | 先给 URL 注明"构建中"，不反复重试刷 API |

---

## Examples

**输入**：本地 Node 库，README 英文、有 3 张截图，环境装了 frontend-design 和 ui-ux-pro-max

**操作**：扫描 manifest + README + git → 内容清单（英文）→ ui-ux-pro-max 出设计系统（如：Glassmorphism + 蓝紫配色 + Inter/Space Grotesk）→ 加载 frontend-design 后写单文件页面 → 浏览器截图自检 → 写 `docs/index.html`，拷 3 张截图进 `docs/assets/`

**输出**：`docs/index.html`（约 40KB）+ `docs/assets/`（3 张图）；报告注明美感来源两个 companion skill；附 GitHub Pages 开启步骤

**输入**：用户给 `https://github.com/foo/bar`，本地没有代码，环境无任何设计 skill

**操作**：远程模式拉 README + API → 基线按项目类型选方向（CLI 工具 → 暗色科技风）→ 图片用 raw URL → 写 `bar-homepage/index.html` → 无浏览器工具，走清单自检

**输出**：`bar-homepage/index.html` 单文件；报告说明可整体拷入目标仓库 `docs/` 发布，美感来源为内置基线方向 A

**输入**：Python 教程仓库，README 中文，用户说"要极简白底的感觉"

**操作**：用户风格偏好直接映射基线方向 B（清爽编辑风）→ 中文页面 → 章节从简（hero + 学习内容 + 快速开始 + 链接）

**输出**：`docs/index.html` 中文极简页；报告注明"用户指定风格，基线方向 B"

**输入**：主页生成后用户选择"自动部署"；remote 是 GitHub，`gh` 已登录，仓库没开过 Pages

**操作**：`git add docs/index.html docs/assets/`（逐个列出，不带工作区其他改动）→ commit（`docs: add project homepage`，风格随仓库）→ push 当前分支 → `gh api` GET pages 得 404 → POST 开启（当前分支 + /docs）→ 轮询构建至 built

**输出**：报告 `https://<user>.github.io/<repo>/` 已上线 + commit hash + 构建状态

**输入**：主页生成后用户选择"自动部署"，但仓库已有一个从 gh-pages 分支发布的 Jekyll 站

**操作**：commit + push 照常 → GET pages 发现源是 `gh-pages` + `/` → **停下询问**是否切换（切换会顶掉现有站点）→ 用户说"别动" → 只报告 push 完成，Pages 保持原样

**输出**：新主页已在仓库 `docs/` 里（随 push 上远端），现有站点不受影响；报告说明原委

---

## 与相邻 skill 的边界

| 想要…… | 用什么 |
| --- | --- |
| 仓库 → 单文件主页 / GitHub Pages landing page | **homepage-craft**（这个 skill） |
| 标准化、人性化的 README.md（Markdown） | `readme-craft`（如已安装） |
| 只出 README 顶部 banner 图 | `readme-banner`（如已安装） |
| 通用 UI / 前端开发，不是"仓库 → 主页"流水线 | `frontend-design` / `ui-ux-pro-max` / `superdesign` 直接使用 |
| 往已有 VitePress / Docusaurus 文档站里加页面 | 按对应框架惯例写，不用本 skill |

---

## Windows (win32) platform notes

流程型 skill：扫描、读取、写 HTML、拷贝图片全用 Read / Write / Glob / Grep 工具，无平台差异。shell 用于 git 只读检测、可选的本地预览（`python -m http.server -d docs 8000`，python 不可用时提示用户直接双击 index.html）和 Step 7 的可选部署（`git add/commit/push` 与 `gh api`，均为跨平台命令，Git Bash / PowerShell 通用；gh 未安装时按 Step 7 降级）。浏览器自检用 `file:///D:/...` 形式的绝对 URL（正斜杠）。拷贝图片到 `docs/assets/` 属于文件操作，用工具完成，不依赖 shell 命令。
