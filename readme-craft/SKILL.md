---
name: readme-craft
description: |
  生成标准化、语气人性化、功能多样化、符合 GFM 规范的 README.md。
  骨架借鉴 Best-README-Template（顶图、shields、目录、back-to-top、底部引用区），
  表达借鉴 README（GFM 全特性：Alerts、diff、折叠、居中、徽章等），
  并可读取项目根目录的 AGENTS.md / CLAUDE.md 作为补充上下文。

  触发："生成 README"、"写一份 README"、"补项目文档"、"readme 怎么写"、
  "我的项目需要一个 README"、"新项目初始化 README"、"完善项目说明"。

  不要在以下情况使用：
  - 需要同时维护 CLAUDE.md（AI 上下文）+ README.md（人类阅读）双层 → 用 human-ai-docs（如已安装；没有就分开维护两个文件）
  - 需要 Rails 命令级细节（bin/dev、bin/rails、Kamal 部署）→ 用 readme（如已安装；没有就按 Rails 惯例手写）
  - 写的是 CHANGELOG / CONTRIBUTING / LICENSE 等单文件 → 直接写，不需要 skill
risk: safe
source: "self-authored"
---

# readme-craft

把项目本身作为主要信源，再借 AGENTS.md / CLAUDE.md 补一层"作者意图"，输出一份一眼看上去"专业、像人写的、规范"的 README.md。

## 设计原则（贯穿整个 procedure）

| 原则 | 含义 | 反例 |
| --- | --- | --- |
| **标准化** | 固定章节顺序、固定徽章格式、固定 back-to-top 链接、底部统一 reference-style 引用 | 每个 README 章节顺序都不同；徽章有的用 shield 有的用别家 |
| **人性化** | 开头用读者视角切入，保留项目个性，避免学究腔 | "This project is a comprehensive, enterprise-grade solution that leverages cutting-edge..." |
| **多样化** | 从可选章节池里按项目实际需要挑，不要 10 份 README 长一个样 | 任何项目都硬塞 Demo / Architecture / Roadmap / FAQ |
| **规范** | GFM 兼容、代码块带语言、表格列对齐、shields.io badge 用真实值 | `npm i` 不写语言；徽章写 `YOUR-USERNAME` 占位没替换 |

风格基线：**像一份好的开源项目 README，不是像一篇论文或营销页。**

---

## Inputs to collect

按需读取，不需要全部问用户：

- **项目路径**：默认当前工作目录
- **项目类型**：library / cli / web-app / api / tutorial / other
  - 优先从 manifest 自动推断（见 Step 1），推断不出再问
- **目标语言**：multi-select，**English 必选且默认勾选**（详见 Step 1.5）
  - 跳过询问的情形：用户明确说"不要问"、给具体语言列表、或选已有的 README 文件作为唯一源
- **是否覆盖已有 README**：默认备份后全量重写（`README.md.bak`）
  - 用户明确说"增量"才做局部更新
- **README banner**：默认自动生成，不问（能力检测与降级见 Step 4.5）
  - 用户说"不要 banner"、或现有 README 已引用可用的 banner / logo 图时跳过

---

## Procedure

### Step 1 — 扫描项目结构

读取根目录列表和关键 manifest，确定 name、version、description、scripts、dependencies、license。

| 类型 | 关键文件 |
| --- | --- |
| Node | `package.json`、`pnpm-lock.yaml`、`yarn.lock`、`package-lock.json` |
| Python | `pyproject.toml`、`requirements.txt`、`setup.py`、`Pipfile` |
| Go | `go.mod` |
| Rust | `Cargo.toml` |
| Java/Kotlin | `pom.xml`、`build.gradle`、`build.gradle.kts` |
| Ruby | `Gemfile` |
| PHP | `composer.json` |
| .NET | `*.csproj`、`*.sln` |

> 这是必做步骤——不读 manifest 就在 README 里写技术栈，几乎一定会猜错。

**顺带收集 git 元信息**（只读命令，不做任何修改）：

```bash
git rev-parse --is-inside-work-tree   # 是否 git 仓库（命令失败再退回检查 .git 目录是否存在）
git describe --tags --abbrev=0        # 最新 tag（没有任何 tag 时非零退出）
git remote get-url origin             # remote URL，从中提取 <user>/<repo>
```

- `<user>/<repo>` 是后续所有 GitHub 徽章和链接的原料：`git@github.com:user/repo.git` 和 `https://github.com/user/repo.git` 都取 `user/repo`；其余 host（GitLab、自建等）记为"非 GitHub"
- 这三项结果在 Step 1.6（tag 检查）和 Step 5（徽章行）都会用到

### Step 1.5 — 选择 README 语言（默认必走）

**用 `ask_user` 工具**多选询问（环境没有该工具时，直接在回复里列出选项问一次），默认行为。**默认路径下 English 必选**（用户要求"默认英文为主 README"）；用户已明确指定语言的按下方结果处理第 3 条，不强制。

```yaml
question: "需要生成哪些语言的 README？"
selectionMode: multiple
options:
  - English（必选，作主 README）     # 默认勾选，id: en
  - 简体中文（zh-CN）                  # id: zh-CN
  - 日本語（ja）                       # id: ja
  - 한국어（ko）                       # id: ko
# 用户可通过 "Others..." 自由输入 BCP-47 标签：zh-TW、fr、de、es、pt-BR 等
```

**结果处理**：
1. 把 Others 里用户输入的字符串也归一为 BCP-47（`中文` → `zh-CN`、`英文` → `en` 等）
2. **默认路径**（用户没明确语言偏好，走多选询问）：`langs` 保证 **English 排第一**（用户没勾选也强制加入）
3. **用户明确指定语言时完全按用户说的来**：说"只要中文"就只生成中文，说"把 README 改成中文"就保持中文为主 README——**不强制加 English**（强制规则只适用于默认路径，覆盖用户明确意愿是错误行为）
4. 第一个元素对应 `README.md`，其他元素对应 `README.<bcp47>.md`
5. 如果用户主动说"不要问"、"按英文来"、"按上次的选择"，跳过本步直接用上次 / 默认值

**注意**：主 README（第一个语言）承担"完整版"角色，其他语言版本可以稍精简——但**所有版本都要可独立阅读**，内容不能靠"见 README.md"这类跨语言引用兜底（末尾导航性的"其他语言"清单除外，见 `references/i18n.md` §6）。

### Step 1.6 — git tag 检查（无 tag 时询问）

依据 Step 1 的 git 检测结果分支：

| 情况 | 动作 |
| --- | --- |
| 非 git 仓库 | 跳过本步，不打扰用户 |
| 已有 tag | 记录最新 tag 值（供 Step 5 徽章用），跳过本步 |
| 是 git 仓库但没有任何 tag | **询问用户是否创建**（见下） |

**询问**（优先用 `ask_user` 工具，环境没有该工具时在回复里列出选项问一次）：

```yaml
question: "项目还没有 git tag，要创建一个吗？（有了 tag，version 徽章和 Releases 页才有内容）"
options:
  - 创建 tag（推荐）
  - 跳过
```

- **创建**：tag 名建议 `v<Step 1 读到的 manifest version>`（如 `v1.2.3`）；manifest 没有 version 字段就让用户输入版本号。执行：

  ```bash
  git tag -a v1.2.3 -m "Release v1.2.3"
  ```

  **绝不自动 push**——只创建本地 tag，在 Step 7 报告里提醒用户推送命令
- **跳过**：version 徽章走 Step 5 的降级路径，不追问

### Step 2 — 读取 AI 上下文（可选，但强烈建议）

如果根目录存在下列任一文件，**先读再写**：

- `AGENTS.md` / `CLAUDE.md`（agents.md 规范）
- `.cursorrules` / `CONVENTIONS.md` / `STYLE.md`
- `.github/copilot-instructions.md`

从这些文件提取：
- 项目目标、目标用户、核心价值主张
- 作者倾向的措辞风格（正式/轻松/极简）
- 是否有特别强调的章节（如性能、安全、兼容性）

**注意**：这些是给 AI 看的指令文件，**不要原样照抄**进 README。把"事实"提取出来，用"人类能读懂的话"重写。涉及密钥、token、内部约定等敏感或非公开信息，必须丢弃。

### Step 3 — 检测部署 / 运行方式

按以下顺序探测，每命中一个就记录：

| 文件 | 含义 |
| --- | --- |
| `Dockerfile` / `docker-compose.yml` / `compose.yaml` | Docker |
| `vercel.json` / `netlify.toml` / `fly.toml` / `render.yaml` / `railway.json` | 平台部署 |
| `Procfile` | Heroku / Heroku-like |
| `k8s/` / `helm/` | Kubernetes |
| `terraform/` | IaC |
| `package.json` 的 `scripts.dev` / `scripts.start` | 直接运行 |
| 都没有 | 通用引导（Quick Start 段落手写命令） |

### Step 4 — 决定模板风格

根据 Step 1 推断的项目类型选骨架（详见 `references/templates.md`）：

| 项目类型 | 核心章节 | 突出章节 |
| --- | --- | --- |
| library / SDK | About / Features / Built With / Installation / Usage / API / License | **API** 必写 |
| CLI | About / Demo / Installation / Usage / Commands / License | **Commands 表格** + 建议配 Demo |
| web-app | About / Screenshots / Features / Tech Stack / Quick Start / Deploy / License | **Screenshots** 强烈建议 |
| API 服务 | About / Features / Endpoints / Auth / Quick Start / License | **Endpoints 表格** + Auth 必写 |
| tutorial / learning | About / What you'll learn / Prerequisites / Steps / FAQ / License | **Steps** 配截图 |
| other | About / Getting Started / Usage / License | 极简版 |

> 选错模板类型是最常见的失败原因——把 CLI 的 README 写成 web-app 风格会导致全篇违和。

### Step 4.5 — README banner（能力检测，默认生成）

判断环境有没有"生图办法"，按能力阶梯取第一条命中的路径：

| 优先级 | 路径 | 命中条件 | 产物 |
| --- | --- | --- | --- |
| 1 | **A：直接写 SVG** | **永远命中**——能写文本文件就能写 SVG | `assets/banner.svg` |
| 2 | **B：生图工具出图** | 本 session 可用工具里有"按文字描述生成图片"的能力（内置生图 / MCP 生图） | `assets/banner.png` |
| — | 跳过 | 用户说"不要 banner"，或现有 README 已引用一张可用的 banner / logo 图 | 无 |

**默认走 A，且不问用户**——写 SVG 的成本等于写一段代码，用户不要 banner 会明确说。B 只在用户主动要求位图 / 复杂视觉时才用；环境有生图工具但用户没提，仍走 A，报告里提一句"可以用生图工具重出位图风格"。

**输入全部复用前序步骤，不新增提问**：

- 项目名 ← Step 1 manifest 的 `name`
- 技术栈标签 ← Step 1 dependencies 里最核心的 2-4 个
- 风格 ← Step 4 项目类型映射（library / CLI → 暗色科技；web-app → 渐变彩色；tutorial / docs → 极简白底）
- 布局、配色、GitHub 渲染硬约束、生成流程 → **按 `references/banner.md` 执行**

**产物**：`<project-root>/assets/banner.svg`，嵌入方式（供 Step 5 第 1 个 section 使用）：

```markdown
<div align="center">
  <img src="./assets/banner.svg" alt="{{PROJECT_NAME}}" width="100%">
</div>
```

**多语言注意**：所有语言版本**共用一张 banner**，图内文字保持语言中立（项目名 + 技术栈），tagline 不进图——tagline 归各语言版本的文字层（单语言项目可以进）。

> banner 属于锦上添花：任何一步失败（推不出项目名、SVG 超重、用户反悔）都直接跳过或降级，不阻塞 README 主流程。

### Step 5 — 撰写 README

按 Best-README-Template 的标准化结构产出。每个 section 的具体写法见 `references/templates.md`；**每条 GFM 语法的规则、陷阱、最佳实践见 `references/gfm-syntax.md`**；**反 AI 味硬规则（破折号节制、标题禁 emoji、Features 不用 inline-header 列表、AI 高频词替换表）见 `references/humanizer-rules.md`**。三份文件按需回查，本节只规定**通用规则**和**顺序**。

**必须按顺序包含的 section**（缺一个都不算合格）：

1. **Banner（如有）+ Title + Tagline**（居中，HTML `<div align="center">` 包裹）
   - Step 4.5 生成了 banner：`<img>` 放最顶，`# 项目名` 的 H1 **仍要保留**——SVG 内文字读屏读不到，社交预览和目录锚点也靠这个标题；没有 banner 时按 logo / 纯标题原样
2. **Shields 徽章行**（build / version / license / stars，按实际能填的填，不可获得的不要写）
3. **Table of Contents**（`<details>` 折叠；全文 < 200 行可省略，与 Step 6 自检口径一致）
4. **About / 项目简介**（2-3 句，"这是啥、给谁用、解决啥问题"）
5. **Getting Started**（Prerequisites + Installation + 第一次 Run）
6. **Usage**（最小可运行示例）
7. **License**
8. **底部 reference-style 引用区**（所有 shields、logo、社交链接的 `[name]: url` 定义）

**按项目类型**从以下池子里挑（不要全要，按需裁剪）：

- Features / Screenshots / Demo / Built With / Tech Stack
- Architecture（复杂项目才写）
- API / Commands / Endpoints（按类型）
- Configuration / Environment Variables（用表格）
- Tests / Deployment / Roadmap
- Contributing / Contact / Authors / Acknowledgments
- FAQ（高频踩坑才写）

**每个 section 都要**：

- **标准化**：标题层级一致（`#` 一次、`##` 大节、`###` 子节）；小节顺序一致
- **人性化**：用第二人称或读者视角开头；保留项目个性；不要"leveraging cutting-edge paradigm"
- **多样化**：可选 section 按项目实际挑，**避免 10 份 README 长一个样**
- **规范**：GFM 兼容、代码块带语言、表格列对齐、所有链接有效

**每个 section 结尾加**（除非是文档末尾）：

```markdown
<p align="right">(<a href="#readme-top">back to top</a>)</p>
```

**Alerts 规范**（GFM）：

```markdown
> [!NOTE]
> 提示信息

> [!TIP]
> 技巧

> [!IMPORTANT]
> 重要

> [!WARNING]
> 警告

> [!CAUTION]
> 严重警告
```

按实际需要选用，不要无脑堆 5 个。

**折叠区**（长内容用 `<details>`）：

```markdown
<details>
<summary>点击展开</summary>

内容……
</details>
```

**徽章**（只列有真实来源的；shields.io 格式）：

```markdown
[![Contributors][contributors-shield]][contributors-url]
[![License][license-shield]][license-url]
[![Version][version-shield]][version-url]
```

底部统一：

```markdown
[contributors-shield]: https://img.shields.io/github/contributors/<user>/<repo>.svg?style=for-the-badge
[contributors-url]: https://github.com/<user>/<repo>/graphs/contributors
```

**version 徽章取值判定**（按顺序命中第一个就停，来源：Step 1 的 git 检测 + Step 1.6）：

1. GitHub 仓库且有 tag → **动态徽章**，发布新版本后自动更新，不会过期：

   ```markdown
   [version-shield]: https://img.shields.io/github/v/release/<user>/<repo>.svg?style=for-the-badge
   [version-url]: https://github.com/<user>/<repo>/releases
   ```

2. 非 GitHub 托管、用户跳过创建 tag、或无 tag 但 manifest 有 version → **静态徽章**（值写死在 URL 里，注意发布新版本后要手动更新）：

   ```markdown
   [version-shield]: https://img.shields.io/badge/version-1.2.3-blue?style=for-the-badge
   ```

3. 两者都不可得 → 不写 version 徽章

### Step 6 — 自检

写完后过一遍：

- [ ] 没有 `[example](example.com)` / `YOUR-USERNAME` / `TBD` / `待补充` 这类占位符残留
- [ ] 章节顺序符合 Step 5 的"必须包含"列表
- [ ] 所有徽章 URL 指向真实资源（不可获得的删掉或留 TODO 注释）
- [ ] 代码块都有语言标识（` ```bash ` / ` ```ts ` / ` ```python ` 等）
- [ ] 表格列对齐、列数一致
- [ ] 文档 > 200 行时，TOC 存在
- [ ] 没有任何空 section（"## License" 后面必须有内容）
- [ ] 中英混排时两边都通顺
- [ ] 有 banner 时：文件真实存在于 `assets/`、README 引用路径正确、`<title>` 不是空话

### Step 7 — 写入并报告

按 `langs` 顺序循环写入每个语言版本：

1. **第一个语言**（默认是 English，见 Step 1.5；用户明确指定唯一语言时按用户要求）→ 写入 `<project-root>/README.md`
2. **后续每个语言** → 写入 `<project-root>/README.<bcp47>.md`（如 `README.zh-CN.md`、`README.ja.md`）
3. 已有同名文件 → 先备份为 `<file>.bak` 再覆盖；若 `.bak` 已存在，改用带时间戳的 `<file>.<YYYYMMDD-HHMMSS>.bak`，**绝不覆盖旧备份**（更早的备份才是用户的原始文件）
4. 输出报告：`已生成 N 份 README（语言: en, zh-CN, ja），主 README: README.md（M 行）`；生成过 banner 追加：`banner: assets/banner.svg（X KB，路径 A）`；Step 1.6 创建过 tag 时追加一句：`已创建本地 tag v1.2.3（未推送，推送请执行 git push origin v1.2.3）`

**翻译原则**（多语言版本必须遵守，详见 `references/i18n.md`）：
- ✅ 翻译：所有自然语言段落、bullet、Alert 文字、表格描述、代码注释
- ⚠️ 章节标题：默认**不翻译标题 key**（i18n.md §4 方案 A，如中英版都用 `## Features`）；用户明确要求"完全本地化观感"时才整篇翻译标题（方案 B）
- ❌ 不翻译：shields 徽章 URL、Markdown 链接、命令/路径/文件名、ASCII 树、技术术语、banner 图（所有语言共用一张，图内文字语言中立）
- ⚠️ 代码块内的注释视上下文可翻译，但**标识符本身绝对不翻译**

---

## Output contract

- 写入 `<project-root>/README.md`（主 README，第一个语言）+ `<project-root>/README.<bcp47>.md` ×（N-1）
- 文档长度 200–600 行/语言（视项目复杂度）
- 包含 Best-README-Template 风格：徽章、TOC、back-to-top、底部引用区
- banner：默认生成 `assets/banner.svg` 并在主 README 顶部引用；跳过时在报告里说明原因（无名字来源 / 用户拒绝 / 已有现成图）
- 每个 section 都有实际内容；不允许出现"待补充"、"TBD"、占位用户名
- 遵循 GFM 规范（表格、代码块、Alerts、折叠、diff 都能正确渲染）
- 多语言版本结构对齐（章节顺序、section 标题一致），便于读者对照

---

## Failure handling

| 情况 | 处理 |
| --- | --- |
| 推断不出技术栈 | 问用户"主要用什么语言/框架？"，不猜 |
| 推断不出项目类型 | 问用户"这是 library、CLI、web 应用还是其他？"，不猜 |
| 已有 README 且 ≥ 50 行 | 先备份再覆盖（`.bak` 已存在时改用带时间戳名，不覆盖旧备份），告诉用户 |
| AGENTS.md / CLAUDE.md 含敏感信息 | 提取事实，绝不原样照抄；敏感字符串替换为 `your-api-key` |
| shields.io 链接失效 | 删掉对应徽章，或在 README 末尾加 `<!-- TODO: 替换失效徽章 -->` 并告知用户 |
| 非 git 仓库（无 `.git`） | 跳过 Step 1.6 的 tag 询问和 GitHub 徽章，version 徽章按 manifest 降级 |
| git 仓库无 tag，用户拒绝创建 | 不追问；version 徽章降级为 manifest 静态值或省略 |
| git 不可用 / 命令失败 | 退回用 `.git` 目录是否存在来判断是否 git 仓库；仍无法判定就按无 tag 处理 |
| 用户没指定项目路径 | 默认当前工作目录 |
| 用户说"和原来一样" | 不动；增量更新要明确说"增量" |
| 默认路径下用户漏选 English | 强制加入（English 必选，详见 Step 1.5）；用户明确指定了语言清单的除外 |
| 用户给的 BCP-47 不规范（如 `chinese`、`簡中`） | 归一化为标准标签（`zh-CN`、`zh-TW` 等）；归一不了就追问 |
| 翻译某语言时遇到不能翻译的梗/双关 | 用同语言等价物替换；如果找不到就保持字面意思并在注释里说明 |
| 推不出项目名（无 manifest 且无目录名可用） | 跳过 banner——图里不能写猜出来的名字 |
| 手写 SVG 超 6KB | 删装饰符号 / 角标重写一次；仍超就保留并在报告说明 |
| 现有 README 已有 banner / logo 图 | 沿用现成的，不生成也不覆盖（见 Step 4.5） |
| B 路径生图失败 / 产物质量差 | 退回 A 路径手写 SVG，告诉用户原因 |
| 用户中途说"不要 banner 了" | 删掉 banner 文件 + 移除 README 里的引用，不追问 |

---

## Examples

**输入**：当前目录有 `package.json`（name: `vuepress-plugin-xxx`，description: "VuePress 主题增强插件"），有 `AGENTS.md` 描述作者风格偏好（"用第二人称、轻松点"）

**操作**：扫描 → 读 AGENTS.md 提取风格 → 推断类型 library → Step 1.5 多选询问（用户选 en + zh-CN）→ 选 library 模板 → 撰写英文版 → 翻译成中文版

**输出**：`./README.md`（英文，主）+ `./README.zh-CN.md`（中文），library 模板，5 个 shields、9 个核心 section，结构对齐，附带 `assets/banner.svg`（暗色科技风，两个语言版共用）

**输入**：用户说"把我的项目 README 改成中文，语气轻松点"

**操作**：读现有 README → 备份 → 按中文 + 轻松风格重写正文，结构保留

**输出**：同结构，风格改造

**输入**：用户说"生成中英日三个 README"

**操作**：跳过 Step 1.5 多选（用户已经指定）→ 撰写三种语言版本 → 写入 `README.md`（en）+ `README.zh-CN.md` + `README.ja.md`

**输入**：用户说"写个 README，banner 不要自动生成"

**操作**：其余流程不变，Step 4.5 直接跳过，顶部按纯标题 + tagline 排

**输出**：README.md，无 banner 文件、顶部无 `<img>`

---

## 与相邻 skill 的边界

| 想要…… | 用什么 |
| --- | --- |
| 标准化、人性化、多样化的 README | **readme-craft**（这个 skill） |
| CLAUDE.md（AI 上下文）+ README.md（人类阅读）双层维护 | `human-ai-docs`（如已安装） |
| Rails 命令级细节（bin/dev、Kamal、credentials） | `readme`（如已安装） |
| 只给现有 README 单独出 banner / 要多候选对比 / 图像 AI 出图 | `readme-banner`（如已安装；readme-craft 内置的是单张 SVG 的默认路径） |

---

## Windows (win32) platform notes

流程型 skill：扫描文件、读 manifest、写 README 全用 Read / Write / Glob / Grep 工具。shell 仅用于 git：Step 1 的只读检测（`rev-parse` / `describe` / `remote`）和 Step 1.6 经用户确认的 `git tag` 创建——命令本身跨平台，Git Bash / PowerShell 通用，无需适配。banner 的 A 路径（手写 SVG）同样只用 Write 写文本文件，无平台差异；可选的 `npx svgo` 压缩和 B 路径的生图工具属于外部能力，不可用时按 Step 4.5 降级跳过。
