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
  - 需要同时维护 CLAUDE.md（AI 上下文）+ README.md（人类阅读）双层 → 用 human-ai-docs
  - 需要 Rails 命令级细节（bin/dev、bin/rails、Kamal 部署）→ 用 readme
  - 写的是 CHANGELOG / CONTRIBUTING / LICENSE 等单文件 → 直接写，不需要 skill
risk: safe
source: "https://github.com/uwakeme/Wake-Skills/tree/main/readme-craft"
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
- **目标语言**：中文 / 英文 / 双语
  - 优先跟随 AGENTS.md / CLAUDE.md / 已有 README 的主语言；都没有默认英文
- **是否覆盖已有 README**：默认备份后全量重写（`README.md.bak`）
  - 用户明确说"增量"才做局部更新

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

### Step 5 — 撰写 README

按 Best-README-Template 的标准化结构产出。每个 section 的具体写法见 `references/templates.md`；**每条 GFM 语法的规则、陷阱、最佳实践见 `references/gfm-syntax.md`**；**反 AI 味硬规则（破折号节制、标题禁 emoji、Features 不用 inline-header 列表、AI 高频词替换表）见 `references/humanizer-rules.md`**。三份文件按需回查，本节只规定**通用规则**和**顺序**。

**必须按顺序包含的 section**（缺一个都不算合格）：

1. **Logo + Title + Tagline**（居中，HTML `<div align="center">` 包裹）
2. **Shields 徽章行**（build / version / license / stars，按实际能填的填，不可获得的不要写）
3. **Table of Contents**（`<details>` 折叠）
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

### Step 7 — 写入并报告

1. 写入 `<project-root>/README.md`
2. 已有 README → 先备份为 `README.md.bak` 再覆盖
3. 输出报告：`已生成 README.md（N 行，X 个 section，含 Y 个 shields 徽章）`

---

## Output contract

- 写入 `<project-root>/README.md`（或用户指定路径）
- 文档长度 200–600 行（视项目复杂度）
- 包含 Best-README-Template 风格：徽章、TOC、back-to-top、底部引用区
- 每个 section 都有实际内容；不允许出现"待补充"、"TBD"、占位用户名
- 遵循 GFM 规范（表格、代码块、Alerts、折叠、diff 都能正确渲染）

---

## Failure handling

| 情况 | 处理 |
| --- | --- |
| 推断不出技术栈 | 问用户"主要用什么语言/框架？"，不猜 |
| 推断不出项目类型 | 问用户"这是 library、CLI、web 应用还是其他？"，不猜 |
| 已有 README 且 ≥ 50 行 | 先备份 `README.md.bak` 再覆盖，告诉用户 |
| AGENTS.md / CLAUDE.md 含敏感信息 | 提取事实，绝不原样照抄；敏感字符串替换为 `your-api-key` |
| shields.io 链接失效 | 删掉对应徽章，或在 README 末尾加 `<!-- TODO: 替换失效徽章 -->` 并告知用户 |
| 用户没指定项目路径 | 默认当前工作目录 |
| 用户说"和原来一样" | 不动；增量更新要明确说"增量" |

---

## Examples

**输入**：当前目录有 `package.json`（name: `vuepress-plugin-xxx`，description: "VuePress 主题增强插件"），有 `AGENTS.md` 描述作者风格偏好（"用第二人称、轻松点"）

**操作**：扫描 → 读 AGENTS.md 提取风格 → 推断类型 library → 选 library 模板 → 撰写

**输出**：`./README.md`，library 模板，5 个 shields、9 个核心 section，标准 GFM 格式，开头"你可能需要它，如果你正在用 VuePress 搭……"

**输入**：用户说"把我的项目 README 改成中文，语气轻松点"

**操作**：读现有 README → 备份 → 按中文 + 轻松风格重写正文，结构保留

**输出**：同结构，风格改造

---

## 与相邻 skill 的边界

| 想要…… | 用什么 |
| --- | --- |
| 标准化、人性化、多样化的 README | **readme-craft**（这个 skill） |
| CLAUDE.md（AI 上下文）+ README.md（人类阅读）双层维护 | `human-ai-docs` |
| Rails 命令级细节（bin/dev、Kamal、credentials） | `readme` |

---

## Windows (win32) platform notes

纯流程型 skill：扫描文件、读 manifest、写 README 全用 Read / Write / Glob / Grep 工具，不涉及 shell 命令调用，无需 PowerShell 适配。
