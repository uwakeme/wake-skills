# AGENTS.md

Wake-Skills 仓库的 agent 操作约定。本文件是该仓库的**项目规则**，任何在本仓库干活的 agent（人或 AI）都应遵守。

## Git 工作流

**直接在 `main` 分支上修改，不要开特性分支再合并。**

- 本仓库是个人 skill 集合，单人维护，无并行开发、无 code review 流程，特性分支带来的合并成本大于收益。
- 改动直接在 `main` 上提交，按小步提交（一个逻辑变更一次 commit）。
- 提交前确认工作区没有无关改动；**只 `git add` 本次涉及的文件，绝不 `git add -A` / `git add .`**。
- 不 `git push --force`。被拒（落后远端 / 分支保护）时停下报告，由仓库所有者决定怎么处理。

## 提交与改动后置

改完 skill 后跑一遍数据生成，让主页与 README 跟上：

```powershell
npm run build   # 重新生成 docs/skills.json + 注入 index.html 的 meta + 更新 README 元信息行
npm run check   # 漂移检测：有漂移退出码 1（等价于「改完忘了 build」）
npm test        # 单元测试，必须全绿
```

Windows 环境注意：`node --test test/` 在本机 Node 上不可用，一律用 `npm test`（内部走 `node --test "test/*.test.mjs"`）。

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
- 各 `<skill>/SKILL.md` 的 frontmatter 是 skill 自身行为的权威：`description` 里的「触发：」段是触发词来源，「不要在以下情况使用：」段是反触发来源。
- 描述里**不要出现 `$`**：`scripts/build-site-data.mjs` 的注入逻辑虽然已改成函数式替换（不受 `$` 影响），但锚点区保持无 `$` 更安全。

## 写触发词时的格式约定

为了让 `scripts/lib/extract.mjs` 稳定解析，SKILL.md frontmatter 的 description 建议遵循：

- 触发行以 `触发：` / `触发词：` / `触发场景：` 开头（行首），后面用引号逐个列出触发词。
- **先把触发词列完再出现第一个句号 `。`**。解析器以句号为边界截断，句号之前的内容才算触发词；句号之后是散文，会被排除。
- 每个触发词控制在 40 字符内，不要跨行写（跨行会被强制拼接，英文单词可能粘连）。
- 反触发段用 `不要在以下情况使用：` / `不要在以下场景使用：` 开头。

写法不规范时不会报错，但可能解析不到触发词——此时主页上该 skill 不显示触发词行。

## README 与 CHANGELOG

- **README.md 主语言固定是中文**。README 的 skill 段落里，「标题行（名称+版本号）」与「触发词行」由脚本生成；**两行之间的手写描述段落是人工内容，脚本永不触碰**。
- 写 README / 对外文档前，主动过一遍 `humanizer` skill 去掉 AI 味。偏好平实、有第一视角、能有个人风格的写法；不要 AI 口号、装饰性 emoji、过度推销腔。
- CHANGELOG 遵循 Keep a Changelog 1.1.0，用 `changelog-craft` 维护。

## 其他

- 仓库零运行时依赖：不引入 npm 包；主页是单文件 HTML，CSS/JS 内联，不用框架、不用构建步骤、不引 CDN。
- 仓库统一 LF 行尾（见 `.gitattributes` 的 `* text=auto eol=lf`）。
- 主页需通过本地 HTTP 服务预览（`python -m http.server -d docs 8000`）；`file://` 协议下浏览器禁止读取本地 `skills.json`，页面会显示提示而不是列表，属预期行为。
