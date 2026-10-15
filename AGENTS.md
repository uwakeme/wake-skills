# AGENTS.md

Wake-Skills 仓库的 agent 操作约定。本文件是该仓库的**项目规则**，任何在本仓库干活的 agent（人或 AI）都应遵守。

## Git 工作流

**直接在 `main` 分支上修改，不要开特性分支再合并。**

- 本仓库是个人 skill 集合，单人维护，无并行开发、无 code review 流程，特性分支带来的合并成本大于收益。
- 改动直接在 `main` 上提交，按小步提交（一个逻辑变更一次 commit）。
- 提交前确认工作区没有无关改动；**只 `git add` 本次涉及的文件，绝不 `git add -A` / `git add .`**。
- 不 `git push --force`。被拒（落后远端 / 分支保护）时停下报告，由仓库所有者决定怎么处理。

## 新增一个 skill 的完整流程

**顺序不能颠倒。** 核心记法：**先登记 marketplace，再 `git add`，最后 `git commit`——提交时 hook 会替你把主页和 README 同步好。**

### 1. 建目录与主体

```
<skill-name>/
├── SKILL.md           # 必备
├── references/        # 可选
└── .claude-plugin/
    └── plugin.json    # ZCode 插件清单
```

起骨架：`mavis skill create <name> -a <agent> --file ./SKILL.md`，或手写。
校验：`node <skill-creator>/scripts/lint-skill.js <skill-name>/`

SKILL.md 的 frontmatter 要写 `name` / `description`（触发词段与反触发段按下方格式约定写），可选 `risk` / `source`。

### 2. 登记到 marketplace（必做，否则主页不显示）

在 `.claude-plugin/marketplace.json` 的 `plugins[]` 里加一项，字段齐全：

```json
{
  "name": "<skill-name>",
  "source": "./<skill-name>",
  "description": "English one-liner.",
  "description_i18n": { "zh-CN": "中文一句话说明。" },
  "version": "0.1.0",
  "author": { "name": "uwakeme" },
  "category": "documentation | design | productivity",
  "keywords": ["关键词1", "关键词2"]
}
```

漏了这一步不会报错，但 `npm run build` 会打印「孤儿 skill」告警，主页上永远看不到它。

### 3. 验证数据装配正确

```powershell
npm run build    # 重新生成 docs/skills.json + 注入 index.html + 更新 README 元信息行
npm run check    # 应当干净退出（0）
npm test         # 单元测试全绿
```

看 build 的输出，确认新 skill 那行的 `触发来源=` 不是 `none`：

```
- <skill-name> v0.1.0 [<category>] 触发来源=skill-md 触发词=N
```

`触发来源=readme` 说明 SKILL.md 的触发词没解析出来（回落到了 README）；`none` 说明两处都没解析到，**主页上这个 skill 不显示触发词行**——回去核对触发词格式。

### 4. 提交（hook 会自动同步生成物）

```powershell
git add .claude-plugin/marketplace.json <skill-name>/
git commit -m "feat: 新增 <skill-name> 技能：<一句话>"
```

pre-commit hook 检测到 `marketplace.json` 或 `SKILL.md` 进了暂存区，会自动跑 build，并把重新生成的 `docs/skills.json`、`docs/index.html` meta、`README.md` 元信息行一并纳入同一次提交。**你不需要手动 build 完再提交**。

hook 不会介入的情况：只改 README 散文、改主页样式等与 skill 数据无关的提交——这是有意的，别改 hook。

### 5. 补 CHANGELOG

在 `CHANGELOG.md` 的 `## [Unreleased]` 下按 Keep a Changelog 归段：新增 skill 归 **Added**，行为变更归 **Changed**，修 bug 归 **Fixed**。

### 6. 一次性设置（每台新机器）

```powershell
git config core.hooksPath .githooks
```

不设这条，第 4 步的自动同步不会发生。

---

## 提交与改动后置

改完 skill 后跑一遍数据生成，让主页与 README 跟上：

```powershell
npm run build   # 重新生成 docs/skills.json + 注入 index.html 的 meta + 更新 README 元信息行
npm run check   # 漂移检测：有漂移退出码 1（等价于「改完忘了 build」）
npm test        # 单元测试，必须全绿
```

Windows 环境注意：`node --test test/` 在本机 Node 上不可用，一律用 `npm test`（内部走 `node --test "test/*.test.mjs"`）。

`npm run check` 会比对 `docs/skills.json`、`docs/index.html`、`README.md` 三个文件（比对时排除 `generatedAt` 与 CRLF/LF 差异）。

## 仓库结构约定

```
<skill-name>/
├── SKILL.md           # 必备，frontmatter 含 name / description
├── references/        # 可选，详细参考
└── .claude-plugin/
    └── plugin.json    # ZCode 插件清单
.claude-plugin/marketplace.json   # 注册表：skill 列表的唯一权威
scripts/                          # 主页与 README 的数据生成脚本
docs/index.html                   # GitHub Pages 主页（手写骨架，数据驱动）
docs/skills.json                  # build 产物，勿手改
```

## 数据单一来源

- **`.claude-plugin/marketplace.json` 是 skill 列表的唯一权威**：name、version、category、keywords、中英描述都只从它读。新增 skill 只需在这里登记 + 建目录，**不要手工编辑 `docs/index.html` 的列表区或 README 的 skill 段落**。
- `docs/skills.json` 是 **build 产物，永远不要手改**——改了下次 `npm run build` 就被覆盖，`npm run check` 会报漂移。要改数据就去改 marketplace.json。
- 各 `<skill>/SKILL.md` 的 frontmatter 是 skill 自身行为的权威：`description` 里的「触发：」段是触发词来源，「不要在以下情况使用：」段是反触发来源。
- 描述里**不要出现 `$`**：`scripts/build-site-data.mjs` 的注入逻辑已改成函数式替换（不受 `$` 影响），但锚点区保持无 `$` 更安全。

## 写触发词时的格式约定

为了让 `scripts/lib/extract.mjs` 稳定解析，SKILL.md frontmatter 的 description 建议遵循：

- 触发行以 `触发：` / `触发词：` / `触发场景：` 开头（行首），后面用引号逐个列出触发词。
- **先把触发词列完再出现第一个句号 `。`**。解析器以句号为边界截断，句号之前的内容才算触发词；句号之后是散文，会被排除。
- 每个触发词控制在 40 字符内，不要跨行写（跨行会被强制拼接，英文单词可能粘连）。
- 反触发段用 `不要在以下情况使用：` / `不要在以下场景使用：` 开头。

写法不规范时不会报错，但可能解析不到触发词——此时主页上该 skill 不显示触发词行。

## 常见告警对照

`npm run build` / `npm run check` 打印的告警与含义：

| 告警 | 原因与处理 |
| --- | --- |
| `孤儿 skill：<name>/ 有 SKILL.md 但未登记到 marketplace.json` | 建了目录忘了登记，主页不会显示它 → 去 marketplace.json 补一项 |
| `marketplace 登记了 "<name>"，但目录 <name>/ 不存在` | marketplace 里有登记但目录没建或名字拼错 → 对齐两边 |
| `"<name>" 缺字段 version/category/description_i18n` | marketplace 条目不完整 → 补齐字段，否则主页显示空值 |
| `"<name>" 没有 SKILL.md` | 目录建了但主体文件没写 → 建 SKILL.md |
| `index.html 缺少 auto:meta 锚点，meta 数字未更新` | `docs/index.html` 的锚点注释被删了 → 恢复 `<!-- auto:meta:count:begin/end -->` |
| `触发来源=none` | SKILL.md 与 README 都解析不到触发词 → 核对触发词格式（见上节） |
| `npm run check` 退出码 1 | 有漂移，跑 `npm run build` 同步 |

`origin/HEAD` 指向非 `main` 的克隆里，`skills.json` 可能持续报漂移——那是分支名导致的，不是内容漂移，别去改脚本迁就它。

## README 与 CHANGELOG

- **README.md 主语言固定是中文**。README 的 skill 段落里，「标题行（名称+版本号）」与「触发词行」由脚本生成；**两行之间的手写描述段落是人工内容，脚本永不触碰**。
- 写 README / 对外文档前，主动过一遍 `humanizer` skill 去掉 AI 味。偏好平实、有第一视角、能有个人风格的写法；不要 AI 口号、装饰性 emoji、过度推销腔。
- CHANGELOG 遵循 Keep a Changelog 1.1.0，用 `changelog-craft` 维护。

## 其他

- 仓库零运行时依赖：不引入 npm 包；主页是单文件 HTML，CSS/JS 内联，不用框架、不用构建步骤、不引 CDN。
- 仓库统一 LF 行尾（见 `.gitattributes` 的 `* text=auto eol=lf`）。
- **主页双击即可打开**：`npm run build` 会把技能数据内联进 `docs/index.html` 的 `<script type="application/json" id="skill-data">`，因此 `file://` 协议下也能看到完整列表。`docs/skills.json` 仍然生成，作为前端 fetch 的降级路径和给其他工具用的数据源。
