# GFM 语法规则（GitHub Flavored Markdown 完整规范）

> 本文件是 `readme-craft` 的 GFM 语法**权威参考**。SKILL.md 主流程规定做什么，templates.md 给具体模板样例，**本文件给每条 GFM 语法的"语法 + 规则 + 最佳实践"**——LLM 撰写 README 时按本文件的规则执行，遇到边界情况回查本文件。

## 0. 通用规则（适用于所有 GFM 块）

- **空行分隔**：块（段落、列表、表格、代码块）之间必须用空行（一个空行即可）分隔
- **缩进**：嵌套块用 2-4 空格缩进，全文统一
- **不可见字符**：行末不要留尾随空格（中文段落尤其）
- **行宽**：段落 80-120 字符，超过就折行
- **HTML 兼容**：GFM 支持内联 HTML，但能不用就不用
- **可访问性**：图片必须 alt、链接文字要说明目的（"点这里"是反例）

---

## 1. 标题（Headings）

### 语法

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
```

### 规则

| 规则 | 说明 |
| --- | --- |
| **每篇一个 H1** | README 只有一个 `#` |
| **层级不跳** | `#` → `##` → `###`，不要 `#` → `###` |
| **统一风格** | 全文用一种：Sentence case / Title Case，不要混 |
| **标题文字后空格** | `# 标题`（`#` 和文字之间一个空格） |
| **自动锚点** | GitHub 自动生成：标题转小写、空格转 `-`、去标点 |

### 反例

```markdown
# 标题

### 跳过了二级（应该用 ##）
```

---

## 2. 文本格式（Emphasis）

### 语法对照表

| 语法 | 效果 | 用途 |
| --- | --- | --- |
| `*斜体*` 或 `_斜体_` | *斜体* | 强调、轻提示 |
| `**粗体**` 或 `__粗体__` | **粗体** | 重点、关键信息 |
| `***粗斜体***` | ***粗斜体*** | 双重强调（慎用） |
| `~~删除线~~` | ~~删除线~~ | 弃用、错误纠正 |
| `` `行内代码` `` | `行内代码` | 变量名、文件名、命令片段 |
| `<https://example.com>` | 自动链接 | URL 单独成行时用 |

### 规则

- **斜体粗体符号紧贴文字**：`*foo*`（不是 `* foo *`）
- **全文统一符号**：要么全用 `*`，要么全用 `_`——**不要混**
- **删除线表"过时"**，不要当装饰
- **行内代码优先**：文件名、命令、变量名一律用 `` ` `` 包起来（视觉清晰 + 防转义）
- **emoji 不用斜体**：`:rocket:` 已经是 emoji 了不要再包 `*`

---

## 3. 列表（Lists）

### 无序列表

```markdown
- 项目 1
- 项目 2
  - 子项 2.1
  - 子项 2.2
- 项目 3
```

- 符号 `-` / `*` / `+` 都可，**全文统一**（推荐 `-`）
- 嵌套缩进 2-4 空格

### 有序列表

```markdown
1. 第一步
2. 第二步
   1. 子步骤 2.1
   2. 子步骤 2.2
3. 第三步
```

- 数字 + `.` + 空格
- 数字不必连续（GFM 自动从 1 计数），**但建议连续**便于维护
- 多级有序列表会自动转罗马数字 / 字母

### 任务列表（GFM 扩展）

```markdown
- [x] 已完成
- [ ] 未完成
  - [ ] 子任务
- [ ] 另一个未完成
```

- GitHub issues 中**可以点击切换**状态
- README 中可以但不能交互

### 规则

- 列表项太长（> 2 行）就拆成子项或段落
- 列表项之间不要空行（除非想让 GFM 当作段落开始）
- 列表内可以嵌套代码块（缩进 4 空格或对齐反引号）

---

## 4. 链接（Links）

### 三种语法

**行内式**：
```markdown
[显示文字](https://example.com "可选悬停标题")
```

**Reference-style**（推荐用于多链接场景）：
```markdown
先在正文里用：
[GitHub][github-url] 是代码托管平台

再在文末定义：
[github-url]: https://github.com
```

**自动链接**：
```markdown
<https://example.com>
<email@example.com>
```

### 规则

| 规则 | 说明 |
| --- | --- |
| **链接文字要描述目的** | ✅ `[GitHub 主页](https://github.com)`；❌ `[点这里](https://github.com)` |
| **多链接用 reference-style** | > 5 个链接就文末统一管理 |
| **锚点全小写** | `[回到目录](#table-of-contents)` 标题里的空格变 `-` |
| **中文标题** | GitHub 现在能识别中文锚点，放心用 |
| **外部链接慎加 `?utm_source=`** | 营销参数会让链接变长且影响 SEO |

### 内部锚点示例

```markdown
<!-- 标题自动生成锚点 -->
## Getting Started

<!-- 在同文档其他位置跳转 -->
回到 [Getting Started](#getting-started)
```

---

## 5. 图片（Images）

### 语法

```markdown
![替代文字](图片URL "可选悬停标题")
```

### 规则

| 规则 | 说明 |
| --- | --- |
| **alt 必填** | 屏幕阅读器必读；图片挂掉时显示 |
| **同仓库用相对路径** | `![架构图](./images/architecture.png)` |
| **跨仓库图片** | `https://raw.githubusercontent.com/<user>/<repo>/<branch>/path` |
| **压缩后再放** | > 1MB 一定要压缩（推荐 tinypng.com / squoosh.app） |
| **截图加边框** | 用 `<div align="center">` 包裹（居中 + 视觉留白） |
| **慎用 base64** | 太大的图不要转 base64，会让 README 变得巨大 |

### 截图排版

```markdown
<div align="center">

![主界面](images/screenshot-home.png)

</div>
```

### 图片链接

```markdown
[![点击看大图](images/thumb.png)](images/full.png)
```

图片套链接：图片本身是缩略图，点击放大。

---

## 6. 块引用（Block Quotes）

### 基础语法

```markdown
> 单行引用
>
> 多行引用，空行分段
> 同一段内换行用空行

> 多级嵌套（不推荐 > 2 级）
>> 子引用
```

### GFM Alerts（增强块引用，GitHub 2023+ 支持）

```markdown
> [!NOTE]
> 给读者的小提示——补充信息、可选内容

> [!TIP]
> 技巧、窍门、推荐做法

> [!IMPORTANT]
> 必读、关键信息

> [!WARNING]
> 可能踩坑、可能导致问题

> [!CAUTION]
> 高危操作，可能丢数据
```

### 规则

- **5 种 alert 按语义选**，不要无脑堆
- **同一 alert 内的多行都用 `> ` 前缀**
- **alert 后空一行**再接下一段
- **不要用 `>>` 表示强调**（视觉上像引用嵌套，读者困惑）

---

## 7. 代码（Code）

### 两种形式

**行内代码**：
```markdown
用 `npm install` 命令安装依赖。
```

**围栏代码块**（推荐）：
````markdown
```bash
npm install
npm run dev
```
````

### 规则

| 规则 | 说明 |
| --- | --- |
| **代码块必须带语言** | 影响语法高亮 + GitHub 提供"复制"按钮 |
| **嵌套代码块用更多反引号** | 外层 4 个、内层 3 个 |
| **不要用缩进代码块** | 围栏语法几乎总是更好 |

### 常用语言标识符

| 类别 | 标识符 |
| --- | --- |
| Shell | `bash` / `sh` / `shell` / `zsh` / `powershell` |
| Web | `html` / `css` / `scss` / `javascript` / `typescript` / `jsx` / `tsx` / `vue` / `svelte` |
| 数据 | `json` / `yaml` / `toml` / `xml` / `csv` / `ini` |
| 后端 | `python` / `go` / `rust` / `ruby` / `java` / `kotlin` / `swift` / `php` / `c` / `cpp` / `csharp` |
| 数据库 | `sql` / `graphql` / `prisma` |
| 工具 | `dockerfile` / `makefile` / `nginx` / `diff` |
| 文档 | `markdown` / `md` |

---

## 8. 表格（Tables）

### 基础语法

```markdown
| 列 1 | 列 2 | 列 3 |
| --- | --- | --- |
| A1 | A2 | A3 |
| B1 | B2 | B3 |
```

### 对齐方式

```markdown
| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| 内容 | 内容 | 内容 |
```

| 标记 | 效果 |
| --- | --- |
| `:---` | 左对齐（默认） |
| `:---:` | 居中 |
| `---:` | 右对齐 |

### 规则

| 规则 | 说明 |
| --- | --- |
| **每行 `|` 数量一致** | 列数对齐的基础 |
| **前后空行** | 表格与上下段落用空行分隔 |
| **列数不要超过 5-6** | 多了横排太挤 |
| **行内可以混用语法** | 链接、粗体、代码、图片都可以塞进单元格 |
| **慎用换行** | 表格内换行要 `<br />`，GFM 表格不支持直接 `\n` |

### 表格内嵌元素示例

```markdown
| 名称 | 描述 |
| --- | --- |
| `foo()` | **必填**，参数见 [API](#api) |
| `bar()` | _可选_，默认 `null` |
```

---

## 9. diff 语法

### 语法

````markdown
```diff
+ 新增的行（渲染为绿色）
- 删除的行（渲染为红色）
@@ -12,6 +12,8 @@ 变更块定位标记
```
````

### 规则

- 三个反引号 + `diff`（不是 `bash`）
- **GitHub 只给 `+` / `-` / `@@` 开头的行着色**；`!`、`#` 等其他前缀没有任何特殊渲染，别当"注释"用
- 只在讲"代码改动"时用（版本对比、迁移指南）
- README 里**很少用**——只在 Changelog / Migration 段落出现

---

## 10. 常用 HTML 元素

### 折叠（Details）

````html
<details>
<summary>点击展开</summary>

这里是被折叠的内容。
可以有多段、列表、代码块。

```bash
echo "nested code block"
```

</details>
````

**规则**：
- 折叠用于"补充信息"（可选展开），**不要把必读内容折叠**
- `<summary>` 文字简洁，< 30 字
- 内容**前后空行**，让 GFM 正确解析

### 居中（Centered）

```html
<div align="center">

居中的内容

</div>
```

**规则**：
- 用 `<div align="center">`（GFM 兼容）
- 元素之间用 `<br />` 换行
- 徽章行、Logo、Tagline 都用这个包

### 换行（Line Break）

```html
<br />
```

**规则**：
- GFM 单换行不渲染，用 `<br />` 强制换行
- 中英文混排段落少用，**优先用空行分段**

---

## 11. 表情（Emojis）

### 语法

```markdown
:rocket: :white_check_mark: :warning:
```

渲染为：🚀 ✅ ⚠️

### 常用 emoji（Features 段）

| emoji | 用途 |
| --- | --- |
| ⚡️ | 性能 |
| 🎨 | UI/UX |
| 🔒 | 安全 |
| 📱 | 移动端 |
| 🚀 | 部署/启动 |
| ✨ | 新特性 |
| 🛠 | 工具 |
| 📦 | 包/模块 |
| 💡 | 想法 |
| 🎯 | 目标 |
| 🔧 | 配置 |
| 📚 | 文档 |
| ✅ | 完成 |

完整列表：https://www.webpagefx.com/tools/emoji-cheat-sheet

### 规则

| 规则 | 说明 |
| --- | --- |
| **统一调性** | 一个 README 选一种风格（全用 / 全不用 / 只在 Features 段用） |
| **标题不用** | `# Installation` 不要写成 `# 🚀 Installation` |
| **不要重复** | 一个段落里同一个 emoji 不要出现多次 |
| **不要滥用** | emoji 是装饰不是内容 |

---

## 12. 徽章（Shields / Badges）

### shields.io 语法

```markdown
![label](https://img.shields.io/badge/<label>-<message>-<color>?style=for-the-badge&logo=<name>&logoColor=<color>)
```

### 常用徽章

```markdown
<!-- License -->
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](./LICENSE)

<!-- Version（GitHub 仓库优先用动态端点，跟随最新 release 自动更新） -->
[![Version](https://img.shields.io/github/v/release/<user>/<repo>.svg?style=for-the-badge)](https://github.com/<user>/<repo>/releases)

<!-- Version（非 GitHub 托管 / 无 tag 时的降级写法，值写死要注意随发布更新） -->
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com/<user>/<repo>/releases)

<!-- Build Status -->
[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)](https://github.com/<user>/<repo>/actions)

<!-- Stars -->
[![Stars](https://img.shields.io/github/stars/<user>/<repo>.svg?style=for-the-badge)](https://github.com/<user>/<repo>/stargazers)
```

### 规则

| 规则 | 说明 |
| --- | --- |
| **URL 不要占位符** | `YOUR-USERNAME` 之类必须替换成真实值 |
| **version 徽章用动态端点** | GitHub 仓库优先 `img.shields.io/github/v/release/<user>/<repo>`（自动跟随最新 release，不会过期）；静态 `badge/version-x.y.z` 只作无 tag / 非 GitHub 时的降级 |
| **4-7 个为佳** | 多了视觉杂乱 |
| **用 `for-the-badge` 样式** | 更醒目，跟 GitHub UI 风格匹配 |
| **logo 在 simpleicons 查** | https://simpleicons.org |
| **徽章配链接** | 徽章本身是图片，套链接让它可点击 |

### Reference-style 徽章行（推荐）

```markdown
<!-- 顶部徽章行 -->
[![License][license-shield]][license-url]
[![Version][version-shield]][version-url]

<!-- 文末定义 -->
[license-shield]: https://img.shields.io/badge/license-MIT-green?style=for-the-badge
[license-url]: ./LICENSE
[version-shield]: https://img.shields.io/github/v/release/<user>/<repo>.svg?style=for-the-badge
[version-url]: https://github.com/<user>/<repo>/releases
```

这样改一个 URL 不用全文搜索。

---

## 13. 段落与换行

### 规则

| 情况 | 规则 |
| --- | --- |
| **段落分隔** | 空一行（中文段落用空行分段最干净） |
| **强制换行** | 用 `<br />`，或行末 2 空格 + 回车（不推荐） |
| **行宽** | 段落 80-120 字符 |
| **中英文混排** | 英文前后加空格（`用 npm 安装` 而不是 `用npm安装`） |

### 反例

```markdown
# ❌ 单换行不换行
第一段
第二段（粘在一起）

# ❌ 行末空格
第一段  ⏎
第二段
```

---

## 14. 转义与特殊字符

### 规则

| 字符 | 写法 | 用途 |
| --- | --- | --- |
| `*` | `\*` | 字面星号 |
| `_` | `\_` | 字面下划线 |
| `` ` `` | `` \` `` | 字面反引号 |
| `#` | `\#` | 字面井号 |
| `<` / `>` | `&lt;` / `&gt;` 或 `< >` | 字面尖括号 |
| `|` | `\|` | 表格内字面竖线 |
| `~` | `\~` | 字面波浪号 |

### 规则

- 代码块内**不需要转义**——这是首选
- 表格内的竖线**必须转义**（否则破坏表格结构）
- 不要为了转义而转义——只在渲染错误时才用

---

## 15. 最佳实践清单（README 写完后过一遍）

- [ ] 只有一个 H1
- [ ] 标题层级连续不跳
- [ ] 段落用空行分隔，没有行末空格
- [ ] 图片都有 alt
- [ ] 链接文字描述目的（不是"点这里"）
- [ ] 链接 > 5 个用 reference-style
- [ ] 代码块都带语言
- [ ] 表格列数对齐
- [ ] 徽章 URL 都是真实值
- [ ] emoji 调性统一
- [ ] 没有占位符（`YOUR-USERNAME`、`TBD`、`待补充`）
- [ ] 章节顺序符合 templates.md 规范
- [ ] 文档 > 200 行有 TOC
- [ ] 没有任何空 section

---

## 附录：GFM 完整语法速查（备忘）

| 元素 | 语法 | GFM 支持 |
| --- | --- | --- |
| 标题 | `# ~ ######` | ✅ |
| 粗体 | `**text**` | ✅ |
| 斜体 | `*text*` | ✅ |
| 粗斜体 | `***text***` | ✅ |
| 删除线 | `~~text~~` | ✅（GFM 扩展） |
| 行内代码 | `` `text` `` | ✅ |
| 代码块 | ` ```lang ` | ✅ |
| 无序列表 | `-` / `*` / `+` | ✅ |
| 有序列表 | `1.` | ✅ |
| 任务列表 | `- [ ]` / `- [x]` | ✅（GFM 扩展） |
| 链接 | `[text](url)` | ✅ |
| 图片 | `![alt](url)` | ✅ |
| 引用 | `>` | ✅ |
| Alerts | `> [!NOTE]` | ✅（GFM 扩展，GitHub 2023+） |
| 表格 | `\| col \|` | ✅（GFM 扩展） |
| 水平线 | `---` / `***` | ✅ |
| 自动链接 | `<url>` | ✅ |
| HTML 元素 | `<details>` 等 | ✅ |
| diff | ` ```diff ` | ✅（GFM 扩展） |
| 数学公式 | `$...$` / `$$...$$` | ✅ GitHub / GitLab（KaTeX）；其他平台不一定 |
| Mermaid | ` ```mermaid ` | ✅ GitHub / GitLab 原生渲染；其他平台不一定 |

---

**与 SKILL.md 的关系**：本文件是"规则字典"，SKILL.md 主流程用时按需引用。撰写 README 时**优先**回查本文件，不要凭印象写。
