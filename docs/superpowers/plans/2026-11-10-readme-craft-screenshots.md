# readme-craft 插图能力实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 readme-craft 在生成 README 时能自动拍下项目界面的真实截图（agent 驱动浏览器实际渲染），出多张候选交用户挑，选中的落进 `assets/screenshots/` 并嵌入 README。

**Architecture:** 在 readme-craft 里新增与 Step 4.5（banner）平级的 **Step 4.6「界面截图」**，细节写进新的 `references/screenshots.md`。截图只对 **web-app / tutorial** 两类项目触发，**失败绝不阻塞 README 主流程**（与 Step 4.5「锦上添花」一致）。拍摄手段走能力阶梯：内置浏览器（桌面候选首选）→ 无头 Chrome（移动端候选唯一手段）→ 跳过。截图与 banner 的默认行为相反（banner 默认不问；截图默认出候选等用户挑），两处必须并排写清各自默认，否则 agent 会记错。

**Tech Stack:** Markdown（SKILL.md + references）、Node.js（`npm run build` / `check` / `test`）、`mcp_browser`（内置浏览器截图）、Chrome headless（`--headless=new --screenshot=`）、PowerShell 5.1（Windows）

**Spec:** `docs/superpowers/specs/2026-11-10-readme-craft-screenshots-design.md`（commit `c806a8e`）

## Global Constraints

- **仓库规则**（`AGENTS.md`）：直接在 `main` 上提交，不开特性分支；**只 `git add` 本次涉及的文件，绝不 `git add -A` / `git add .`**；小步提交。
- **数据单一来源**：`.claude-plugin/marketplace.json` 是 skill 列表唯一权威；`docs/skills.json` 是 build 产物，**永远不要手改**；README 的 skill 段落里「标题行 + 触发词行」由脚本生成，**描述段落是人工内容，脚本永不触碰**。
- **触发词格式**（`scripts/lib/extract.mjs` 的解析规则）：触发行以 `触发：` / `触发词：` / `触发场景：` 开头（行首）；**先把触发词列完再出现第一个句号 `。`**（解析器以句号切边界）；每个触发词 ≤ 40 字符、不跨行；反触发段用 `不要在以下情况使用：` / `不要在以下场景使用：` 开头。
- **描述里不要出现 `$`**。
- **版本**：readme-craft `0.2.1` → `0.3.0`（新增能力 = minor）。marketplace.json 与 plugin.json **两处都要改**。
- **零运行时依赖**：不引入 npm 包；不引 CDN。
- **行尾**：统一 LF（`.gitattributes` 的 `* text=auto eol=lf`）。
- **Windows**：`node --test test/` 在本机不可用，一律用 `npm test`（内部走 `node --test "test/*.test.mjs"`）；PowerShell 5.1 **不支持 `&&` / `||`**，用 `; $ErrorActionPreference='Stop'`。
- **清理文件**：只走一条顶层 `rm <paths...>` 命令（不要套 wrapper、不要与其它命令连写）。
- **并发会话**：本仓可能有另一个会话在改动（已见 `assets/banner.svg`、`.gitignore`、`node_modules/`）。**绝不提交自己没改过的文件**；`git status` 里出现的 `.tmp-svgo/`、`.zcodeignore`、`node_modules/`、`package-lock.json` 不是本次改动，**不要 stage、不要删**。
- **pre-commit hook**：已配置 `core.hooksPath .githooks`。暂存 `SKILL.md` 或 `marketplace.json` 时 hook 会自动跑 build 并把 `docs/skills.json`、`docs/index.html`、`README.md` 纳入同一次提交 ⇒ **不需要手动 build 完再提交**，但**需要提前手动跑一遍 check** 确认无漂移。
- **本仓已有 `assets/` 目录**（含 `assets/banner.svg`，已被追踪）⇒ 截图落 `assets/screenshots/` 时**不要新建另一个 `assets/`**，也不要动 `assets/banner.svg`。
- **实测事实**（写 reference 时直接引用，不要重新推导）：
  - `mcp_browser screenshot` 返回 `userDelivery.filePath`（真实 PNG 落盘在运行时目录），**只接受 `scope` 参数，传 `path` 会报错** ⇒ 必须「拷进项目」这一步。
  - 内置浏览器视口**固定 1280×720**，无 resize / 设备模拟动作 ⇒ **移动端候选只能走无头 Chrome**（`--window-size=390,844`）。
  - 当前标签页有内容时 `navigate` 报 `CURRENT_TAB_OCCUPIED` ⇒ 用 `open_tab`。
  - 无头 Chrome 能拍已水合的 SPA（`--virtual-time-budget=4000`）、能拍 localhost、能直写目标路径。

---

### Task 1: 新增 `references/screenshots.md`（拍摄规范全文）

**Files:**
- Create: `readme-craft/references/screenshots.md`

**Interfaces:**
- Consumes: 无（独立文档）
- Produces: 供 SKILL.md Step 4.6 引用的拍摄规范；后续 Task 2 的 SKILL.md 文本直接指向本文件。

- [ ] **Step 1: 写 `readme-craft/references/screenshots.md`**

内容必须自包含（readme-craft 独立安装时也能用），结构如下（照抄这段骨架，再填正文）：

```markdown
# README 界面截图生成规范（Step 4.6 配套）

> 何时读：Step 4.6 决定拍截图后，按本文件产出图。
> 本文件自包含（readme-craft 独立安装时也能用）；只要 banner 不要截图的，用 readme-banner 技能（如已安装）。

---

## 何时适用

- **只在 web-app / tutorial 两类项目上跑**（Step 4 判定的项目类型）。
- library / API / CLI 没有界面可拍 → 直接跳过本步，不问、不报告。
- 用户明确说「不要截图」→ 跳过。

## 产物

- 落盘：`<project-root>/assets/screenshots/`（与 banner 的 `assets/banner.svg` 同级）
- 命名：语义化，如 `home-desktop.png`、`home-mobile.png`、`dashboard.png`
- README 引用：`![首页](./assets/screenshots/home-desktop.png)`
- **所有语言版本共用同一批图**（图内无文字，语言中立）

## 流程

1. **探测服务**：读 manifest 的 `scripts.dev` / `scripts.start` / `scripts.serve`；同时探测常见端口（3000 / 5173 / 4200 / 8080 / 8000）是否已有服务在跑
   - 已在跑 ⇒ 直接用，**不要重复启动**，也**不要关掉它**（不是本步起的）
2. **启动 dev server**：后台启动，等端口就绪（轮询探测，超时上限约 60 秒）
   - 没有 dev 命令 / 起不来 ⇒ **跳过本步**，README 其余照写，报告里说明原因。**绝不阻塞主流程。**
   - 端口被占 ⇒ 换端口重试一次；仍不行则跳过
3. **拍候选**（见下节）
4. **交用户挑**（见下节）
5. **落盘**：选中的拷进 `assets/screenshots/`
6. **关掉 dev server**：**本步自己起的必须关**；本来就在跑的不是自己起的 ⇒ 不要关
7. **写进 README**：Screenshots 章节引用 `./assets/screenshots/<name>.png`

## 候选集（默认 4 张）

| 候选 | 视口 | 手段 | 说明 |
| --- | --- | --- | --- |
| 首页 | 1280×720 桌面 | 内置浏览器（降级：无头 Chrome） | 主视觉，最重要的一张 |
| 首页 | 390×844 移动 | **只能无头 Chrome** | 展示响应式表现 |
| 关键子页面 ×1-2 | 1280×720 桌面 | 内置浏览器（降级：无头 Chrome） | 从首页导航栏的链接里找 |

## 拍摄手段（能力阶梯，取第一条命中的）

### 路径 A：内置浏览器（桌面候选首选）

能交互（点导航、填表单）、能复用登录态。

1. 先加载 browser 技能（browser-use:control-in-app-browser），它是会话级前置
2. `open_tab` 打开 `http://127.0.0.1:<port>/`
   - ⚠️ 当前标签页已有内容时 `navigate` 会报 `CURRENT_TAB_OCCUPIED` ⇒ **用 `open_tab`**
3. 等页面稳定（SPA 要等水合，否则拍到加载态）
4. `screenshot`（`scope: "viewport"`）⇒ 返回 `userDelivery.filePath`
   - ⚠️ 截图动作**只接受 `scope`**，传 `path` 会报错 ⇒ 产物在运行时目录，**必须拷进项目**
5. `Copy-Item -LiteralPath "<filePath>" -Destination "<project>/assets/screenshots/<name>.png"`
6. 关键子页面：从导航栏链接取路径，逐个打开 + 截图

### 路径 B：无头 Chrome（降级 / 移动端唯一手段）

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --screenshot="<project>/assets/screenshots/<name>.png" --window-size=390,844 "http://127.0.0.1:<port>/"
```

- Chrome 不在这条路径 ⇒ 试 Edge：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
- `--virtual-time-budget=4000` 让 SPA 有时间水合，否则拍到加载态
- `--window-size` 决定视口；**移动端 390×844**、桌面 1280×720
- 这条路径**直写**目标路径，不需要拷贝步骤

### 视口限制（务必记住）

内置浏览器视口**固定 1280×720**，**改不了尺寸** ⇒ 移动端候选**必须**用无头 Chrome。
无头 Chrome 不可用时 ⇒ 移动端候选跳过，其余桌面候选照走。

## 交用户挑

- 候选图**逐张交付**给用户（媒体交付），配编号 + 一句话说明（哪一页、哪个视口）
- 用 `ask_user` 让用户选：保留哪几张 / 全要 / 全不要（选项即候选编号）
- **未选中的候选不落进项目**
- 用户不选 ⇒ 默认保留「首页桌面版」，报告里说明
- 全部不要 ⇒ 不写 Screenshots 章节，README 其余照常

## 降级与容错

| 情况 | 处理 |
| --- | --- |
| 项目类型不是 web-app / tutorial | 跳过本步，不报告 |
| 没有 dev 命令 / 起不来 | 跳过截图，README 其余照写，报告说明原因 |
| 端口被占 | 换端口重试一次；仍不行则跳过 |
| 页面要求登录 | 只截公开部分；**不代填凭据** |
| 页面有验证码 | 跳过该页，不猜、不绕过 |
| 内容含隐私（邮箱 / 真实姓名 / 内部地址） | **不截**，换页面或跳过 |
| 浏览器工具不可用 | 降级到无头 Chrome |
| 无头 Chrome 也不可用 | 跳过本步 |
| 拍出来是空白 / 加载态 | 加等待重拍一次；仍不行则弃用该候选 |
| 用户中途说「不要截图了」 | 删掉已落盘的截图 + 移除 README 引用，不追问 |

## 写进 README

Screenshots 章节（放在 About 之后、Features 之前）：

```markdown
## Screenshots

<div align="center">
  <img src="./assets/screenshots/home-desktop.png" alt="首页" width="100%">
</div>
```

- 多张时用表格对齐排版（见 `templates.md` §3）
- alt 文本写清「哪一页」，不要写 "screenshot" 这种空话
- 引用路径必须**真实存在** ⇒ 写完自查文件在磁盘上

## 反例

- ❌ 拍到加载态 / 白屏就当成品交上去
- ❌ 用 AI 生成图冒充真实界面截图
- ❌ 截图里带出真实邮箱 / 内部地址 / 用户数据
- ❌ 截图文件留在运行时目录，README 却引用了它（别人仓库里 404）
- ❌ 因为截图失败就不写 README
```

- [ ] **Step 2: 自查文件存在且内容完整**

Run: `Get-Item readme-craft/references/screenshots.md | Select-Object Length; Select-String -Path readme-craft/references/screenshots.md -Pattern 'CURRENT_TAB_OCCUPIED','virtual-time-budget','390×844','assets/screenshots' | Measure-Object | Select-Object -ExpandProperty Count`

Expected: Length > 3000；Count ≥ 4（四处关键事实都在）

- [ ] **Step 3: 确认没有 $ 字符（脚本注入安全性）**

Run: `Select-String -Path readme-craft/references/screenshots.md -Pattern '\$' | Measure-Object | Select-Object -ExpandProperty Count`

Expected: 0

- [ ] **Step 4: Commit**

```bash
git add readme-craft/references/screenshots.md
git commit -m "feat(readme-craft): 新增 screenshots.md 界面截图拍摄规范"
```

> 注意：本次只 stage reference 文件，**不要** stage `docs/skills.json` / `docs/index.html` / `README.md`（hook 不介入这种提交，生成物下次 build 再同步）。

---

### Task 2: SKILL.md 加 Step 4.6 与触发词

**Files:**
- Modify: `readme-craft/SKILL.md`（frontmatter description；Inputs；Step 4.5 之后；Step 5；Step 6 自检；Step 7 报告；Output contract；Failure handling；Windows notes）

**Interfaces:**
- Consumes: Task 1 的 `readme-craft/references/screenshots.md`
- Produces: readme-craft 0.3.0 的主体；触发词从 7 条变 10 条（供 Task 4 的验收断言）

- [ ] **Step 1: 改 frontmatter description —— 加 3 条触发词**

在 `触发：` 那一行的引号列表末尾追加三条（**必须加在句号之前**）：

```
  触发："生成 README"、"写一份 README"、"补项目文档"、"readme 怎么写"、
  "我的项目需要一个 README"、"新项目初始化 README"、"完善项目说明"、
  "生成项目截图"、"README 里放界面截图"、"给项目拍截图"。
```

- [ ] **Step 2: 改 frontmatter description —— 补一句能力描述 + 反触发**

在 description 的散文段末尾（`触发：` 行之前）加一句：

```
  web-app / tutorial 类项目还能自动拍下界面的真实截图（驱动浏览器实际渲染），
  出多张候选交用户挑，选中的落进 assets/screenshots/ 并嵌入 README。
```

并在 `不要在以下情况使用：` 的列表末尾加一条：

```
  - 只要一张 README 顶部 banner / hero 图 → 用 readme-banner（如已安装）
```

- [ ] **Step 3: Inputs 增加「界面截图」一项**

在 `README banner` 那条之后加：

```
- **界面截图**：默认仅 web-app / tutorial 自动拍（web-app 的 Screenshots 章节、tutorial 的 Steps 配图）
  - 用户说「不要截图」→ 跳过
  - 其它项目类型 → 跳过，不问
  - 候选多张时交用户挑（见 Step 4.6）
```

- [ ] **Step 4: 新增 Step 4.6**

在 Step 4.5 整段之后、`### Step 5 — 撰写 README` 之前插入：

```markdown
### Step 4.6 — 界面截图（仅 web-app / tutorial，失败不阻塞）

**只在 Step 4 判定为 web-app 或 tutorial 时执行**；其它项目类型直接跳过，不问、不报告。

> ⚠️ **与 Step 4.5 的默认行为相反，别记混**：Step 4.5（banner）**默认直接生成、不问用户**；Step 4.6（截图）**默认出多张候选、等用户挑**。

**能力检测**（按顺序取第一条命中的）：

| 优先级 | 路径 | 命中条件 | 视口 |
| --- | --- | --- | --- |
| 1 | **内置浏览器**（browser skill + `mcp_browser`） | 本 session 可用浏览器工具 | 固定 1280×720 |
| 2 | **无头 Chrome**（`--headless=new --screenshot=`） | 系统装了 Chrome / Edge | **任意**（可 390×844） |
| — | 跳过 | 上面都没有 | 无图 |

**流程**（完整细则见 `references/screenshots.md`）：

1. 探测 dev 命令（`scripts.dev` / `start` / `serve`）与常见端口（3000 / 5173 / 4200 / 8080 / 8000）
   - 已有服务在跑 ⇒ 直接用，不重复启动，也**不要关掉它**
2. 自己起 dev server（后台），等端口就绪（超时上限约 60 秒）
   - 起不来 / 没有 dev 命令 ⇒ **跳过本步**，README 其余照写，报告里说明原因
3. 拍候选 4 张：首页桌面 / 首页移动 / 关键子页面 ×1-2
   - **移动端只能用无头 Chrome**（内置浏览器视口固定，改不了尺寸）
   - SPA 要等水合完成再拍，否则拍到加载态
4. 逐张交付给用户 + `ask_user` 让用户挑（保留哪几张 / 全要 / 全不要）
   - 未选中的**不落进项目**
5. 选中的拷进 `<project-root>/assets/screenshots/`，语义命名（`home-desktop.png` 等）
6. **关掉本步自己起的 dev server**；本来就在跑的不要关
7. 在 README 的 Screenshots 章节引用 `./assets/screenshots/<name>.png`

**失败不阻塞**：截图拿不到是锦上添花没做成，README 其余部分照写，报告里说明原因即可——**不要因为截图失败就不写 README**。
```

- [ ] **Step 5: Step 5 加 Screenshots 章节的写法**

在 Step 5 的「必须按顺序包含的 section」列表里，第 1 项（Banner）之后加一项：

```
   - **Screenshots**（仅 Step 4.6 拍到图时）：Step 4.6 拍到了图才写这一节；没拍到就整节跳过，**不要留占位符**
     - 单张用居中 `<div align="center">` + `<img width="100%">`；多张用表格对齐排版
     - alt 写清是哪一页，不要写 "screenshot" 这种空话
```

- [ ] **Step 6: Step 6 自检加两条**

在自检清单里加：

```
- [ ] 有截图时：`assets/screenshots/` 下的文件真实存在、README 引用路径与实际文件名完全一致（大小写也要一致）
- [ ] 有截图时：没有空白图 / 加载态截图混进去（拍到加载态就重拍或弃用）
```

- [ ] **Step 7: Step 7 报告加截图行**

在 Step 7 的输出报告那句里追加（仅当 Step 4.6 产出了图）：

```
；截图：assets/screenshots/ 下 N 张（<文件名列表>）
```

并在 Failure handling 表里加这些行：

| 情况 | 处理 |
| --- | --- |
| 项目类型不是 web-app / tutorial | 跳过截图，不报告，不影响 README |
| 没有 dev 命令 / dev server 起不来 | 跳过截图，README 其余照写，报告说明原因 |
| 截图拍到加载态 / 空白 | 加等待重拍一次；仍不行则弃用该候选 |
| 截图内容含邮箱 / 真实姓名 / 内部地址 | 不落盘，换页面或跳过 |
| 页面要求登录 / 有验证码 | 只截公开部分，不代填凭据、不猜验证码 |
| 浏览器工具不可用 | 降级到无头 Chrome；也没有则跳过本步 |
| 用户中途说「不要截图了」 | 删掉已落盘的截图 + 移除 README 引用，不追问 |

- [ ] **Step 8: Output contract 与 Windows notes 补一句**

Output contract 里加一条：

```
- 截图（仅 web-app / tutorial）：默认拍候选交用户挑，选中的落 `assets/screenshots/`；拍不到就跳过，不阻塞 README
```

Windows notes 里加一句：

```
Step 4.6 的截图步骤会用到 shell（后台起 dev server、无头 Chrome 截图、拷文件），跨平台命令一致；浏览器截图动作本身不用 shell。
```

- [ ] **Step 9: 验证触发词解析成 10 条**

Run: `node -e "import('./scripts/lib/extract.mjs').then(async m=>{const fs=await import('node:fs');const {fields}=m.parseFrontmatter(fs.readFileSync('readme-craft/SKILL.md','utf8'));const t=m.extractTriggersFromSkillMd(fields.description);console.log(t.length, JSON.stringify(t));})"`

Expected: 输出 `10 [...]`，且数组里包含 `生成项目截图`、`README 里放界面截图`、`给项目拍截图`，**不含散文**（不含「不要在以下情况使用」等）

- [ ] **Step 10: 验证反触发与 description 无 $**

Run: `node -e "import('./scripts/lib/extract.mjs').then(async m=>{const fs=await import('node:fs');const {fields}=m.parseFrontmatter(fs.readFileSync('readme-craft/SKILL.md','utf8'));console.log(m.extractAntiTriggers(fields.description));console.log('HAS_DOLLAR', fields.description.includes('$'));})"`

Expected: 反触发数组 ≥ 4 条；`HAS_DOLLAR false`

- [ ] **Step 11: Commit**

```bash
git add readme-craft/SKILL.md
git commit -m "feat(readme-craft): 新增 Step 4.6 界面截图与 3 条截图触发词"
```

> hook 会自动跑 build 并把 `docs/skills.json` / `docs/index.html` / `README.md` 纳入同一次提交 ⇒ **不要手动 stage 这三个文件**。

---

### Task 3: 改 `references/templates.md` 的截图路径

**Files:**
- Modify: `readme-craft/references/templates.md`（web-app 模板的 Screenshots 表格 + library 模板的 `[product-screenshot]`）

**Interfaces:**
- Consumes: 无
- Produces: 全仓截图路径统一到 `assets/screenshots/`（消除 `images/` 与 `assets/` 并存）

- [ ] **Step 1: 改 web-app 模板的 Screenshots 表格**

把：

```markdown
| Home | Dashboard | Mobile |
| --- | --- | --- |
| ![home](images/screenshot-home.png) | ![dashboard](images/screenshot-dashboard.png) | ![mobile](images/screenshot-mobile.png) |
```

改成：

```markdown
| Home | Dashboard | Mobile |
| --- | --- | --- |
| ![home](assets/screenshots/home-desktop.png) | ![dashboard](assets/screenshots/dashboard.png) | ![mobile](assets/screenshots/home-mobile.png) |
```

- [ ] **Step 2: 改 library 模板的截图引用**

把 `About The Project` 里的：

```markdown
[![Product Name Screen Shot][product-screenshot]](https://example.com)
```

保持不变，但把底部引用区的 `[product-screenshot]: images/screenshot.png` 改成：

```markdown
[product-screenshot]: assets/screenshots/home-desktop.png
```

- [ ] **Step 3: 确认全仓没有残留 images/ 截图路径**

Run: `Select-String -Path readme-craft/references/*.md,readme-craft/SKILL.md -Pattern 'images/screenshot' | Measure-Object | Select-Object -ExpandProperty Count`

Expected: 0

- [ ] **Step 4: Commit**

```bash
git add readme-craft/references/templates.md
git commit -m "fix(readme-craft): 截图路径统一到 assets/screenshots/"
```

---

### Task 4: 版本与市场登记同步

**Files:**
- Modify: `.claude-plugin/marketplace.json`（readme-craft 条目：version / description / description_i18n）
- Modify: `readme-craft/.claude-plugin/plugin.json`（version / description）

**Interfaces:**
- Consumes: Task 2 的 SKILL.md（触发词与能力描述）
- Produces: 主页上 readme-craft 显示 v0.3.0 且描述含「截图」；供 Task 5 的 build/check 验收

- [ ] **Step 1: 改 marketplace.json 的 readme-craft 条目**

version 改 `"0.3.0"`；`description`（英文）末尾追加：

```
For web-app and tutorial projects it can also drive a browser to capture real UI screenshots and embed them in the README.
```

`description_i18n.en` 同步追加同一句英文；`description_i18n["zh-CN"]` 追加：

```
web-app / tutorial 类项目还能自动驱动浏览器拍下界面的真实截图并嵌入 README。
```

- [ ] **Step 2: 改 plugin.json**

`version` 改 `"0.3.0"`；`description` 末尾追加同一句英文：

```
For web-app and tutorial projects it can also drive a browser to capture real UI screenshots and embed them in the README.
```

- [ ] **Step 3: 确认 marketplace.json 是合法 JSON**

Run: `node -e "const m=JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'));const e=m.plugins.find(p=>p.name==='readme-craft');console.log(e.version, e.description.includes('screenshot'), e.description_i18n['zh-CN'].includes('截图'), Object.keys(e).sort().join(','))"`

Expected: `0.3.0 true true author,category,description,description_i18n,keywords,name,source,version`（字段集合与其它条目一致）

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/marketplace.json readme-craft/.claude-plugin/plugin.json
git commit -m "feat(readme-craft): 0.3.0 登记截图能力（marketplace + plugin 清单）"
```

> hook 会自动跑 build 并纳入生成物。

---

### Task 5: 仓库 README 描述段 + CHANGELOG

**Files:**
- Modify: `README.md`（readme-craft 段落的**手写描述段落**，两行脚本生成的不动）
- Modify: `CHANGELOG.md`（`## [Unreleased]` → `### Added`）

**Interfaces:**
- Consumes: Task 2 / Task 4 的内容
- Produces: 对外文档与变更记录跟上一致

- [ ] **Step 1: 改 README.md 的 readme-craft 手写描述段**

当前文本：

```
覆盖 5 种项目类型：library / CLI / web-app / API / tutorial；带 4 份 reference（`templates.md` 写模板、`gfm-syntax.md` 管语法、`humanizer-rules.md` 防 AI 味、`banner.md` 管 banner 生成）。
```

改成（两处都改：reference 数量 4 → 5，并加截图能力）：

```
覆盖 5 种项目类型：library / CLI / web-app / API / tutorial；带 5 份 reference（`templates.md` 写模板、`gfm-syntax.md` 管语法、`humanizer-rules.md` 防 AI 味、`banner.md` 管 banner 生成、`screenshots.md` 管界面截图拍摄）。

web-app / tutorial 类项目还会自动驱动浏览器拍下界面的真实截图：自己拉起 dev server、渲染页面、出多张候选交你挑，选中的落进 `assets/screenshots/` 并嵌入 README 的 Screenshots 章节。拍不到就跳过，不影响 README 其余部分。
```

> ⚠️ **只改这两段散文**。标题行的版本号（`### [readme-craft](./readme-craft) \`v0.2.1\``）与「触发词：」行由 `npm run build` 生成——脚本会自己改，**不要手写**。

- [ ] **Step 2: 补 CHANGELOG 的 Added 条目**

在 `## [Unreleased]` → `### Added` 列表**末尾**追加一行：

```
- **readme-craft 0.3.0**：新增 Step 4.6「界面截图」——仅 web-app / tutorial 触发，agent 自己拉起 dev server、驱动浏览器渲染真实界面，出多张候选交用户挑，选中的落进 `assets/screenshots/` 并嵌入 README 的 Screenshots 章节；内置浏览器视口固定（移动端候选走无头 Chrome），截图失败不阻塞 README 主流程
```

- [ ] **Step 3: 跑 build 并确认生成物同步**

Run: `npm run build`

Expected: 退出码 0；输出里 readme-craft 那行显示 `触发来源=skill-md 触发词=10`

- [ ] **Step 4: 跑漂移检测**

Run: `npm run check`

Expected: 退出码 0（无漂移）

- [ ] **Step 5: 跑单元测试**

Run: `npm test`

Expected: 退出码 0，`# fail 0`（基线 69 个用例全绿，不新增用例时数量不变）

- [ ] **Step 6: 确认主页收录了新 reference**

Run: `node -e "const j=require('./docs/skills.json');const r=j.skills.find(s=>s.name==='readme-craft');console.log(r.version, r.references.join(','), r.triggers.length, r.triggerSource);"`

Expected: `0.3.0 banner.md,gfm-syntax.md,humanizer-rules.md,i18n.md,screenshots.md,templates.md 10 skill-md`

- [ ] **Step 7: Commit**

```bash
git add README.md CHANGELOG.md docs/skills.json docs/index.html
git commit -m "docs(readme-craft): README 描述补截图能力 + CHANGELOG 记 0.3.0"
```

> 若 hook 已自动把这些文件纳入上一次提交，这里 `git add` 会报 nothing to commit ⇒ 跳过本步的 commit，只确认 `git status` 干净（除他人改动外）。

---

### Task 6: 端到端自检（真跑一遍 Step 4.6）

**Files:**
- Create（临时，验证后删除）: `D:\WorkSpace\projects\Wake-Skills\.tmp-e2e/`
- 不改任何被追踪文件

**Interfaces:**
- Consumes: Task 1 的规范、Task 2 的 Step 4.6
- Produces: 「这套流程真能跑」的证据（不是纸面流程）

- [ ] **Step 1: 起一个带 SPA 的测试服务**

用 write 工具写 `D:\WorkSpace\projects\Wake-Skills\.tmp-e2e\server.js`（内容见下），再用 bash 后台启动 `node server.js`（端口 4399）：

```javascript
const http = require("http");
const html = `<html><body style="background:#141a24;color:#e9a15a;font:600 44px sans-serif;display:grid;place-items:center;height:100vh"><div id="app">booting</div><script>setTimeout(()=>{document.getElementById("app").textContent="E2E READY"},1200)</script></body></html>`;
const s = http.createServer((q, r) => { r.setHeader("Content-Type", "text/html"); r.end(html); });
s.listen(4399, () => console.log("ready on 4399"));
```

- [ ] **Step 2: 用无头 Chrome 拍移动端候选并确认水合完成**

Run: `& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --screenshot=".tmp-e2e/home-mobile.png" --window-size=390,844 "http://127.0.0.1:4399/"`

Expected: 输出 `bytes written to file ...home-mobile.png`；随后 read 该文件应得到 390×844 的 PNG，且画面上是 "E2E READY"（不是 "booting"）

- [ ] **Step 3: 用内置浏览器拍桌面候选并确认拷进项目**

用 `mcp_browser` 的 `open_tab` 打开 `http://127.0.0.1:4399/` → `screenshot`（scope viewport）→ 记下返回的 `userDelivery.filePath` → `Copy-Item` 到 `.tmp-e2e/home-desktop.png`

Expected: 文件存在，read 得到 1280×720 的 PNG

- [ ] **Step 4: 确认关掉 dev server 后端口释放**

Run: 停掉后台任务后 `try { Invoke-WebRequest 'http://127.0.0.1:4399/' -TimeoutSec 3 } catch { "PORT RELEASED" }`

Expected: `PORT RELEASED`

- [ ] **Step 5: 清理临时目录**

Run: `rm D:\WorkSpace\projects\Wake-Skills\.tmp-e2e`

Expected: `mavis-trash: moved to trash: '...\.tmp-e2e'`

- [ ] **Step 6: 确认工作区没留下自己的垃圾**

Run: `git status --short`

Expected: 只剩**他人**的改动（`.tmp-svgo/`、`.zcodeignore`、`node_modules/`、`package-lock.json`、`.gitignore`），**没有** `.tmp-e2e/`、`assets/screenshots/`

---

## 自查清单（写完计划后逐条核对）

- [ ] **spec 覆盖**：spec §3 流程 → Task 2 Step 4；spec §4 候选集与手段 → Task 1 + Task 2 Step 4；spec §5 交用户挑 → Task 1「交用户挑」节；spec §6 降级表 → Task 1「降级与容错」节 + Task 2 Step 7；spec §7 产物目录 → Task 1「产物」节 + Task 3；spec §8 改动面 → Task 1/2/3/4/5；spec §9 验收 → Task 2 Step 9-10、Task 4 Step 3、Task 5 Step 3-6；spec §10 风险 → Task 2 Step 6（关 server）、Task 6（e2e）。
- [ ] **占位符扫描**：本计划无 TBD / TODO / 「类似 Task N」。
- [ ] **命名一致**：全仓统一 `assets/screenshots/`（Task 1 / 2 / 3 一致）；截图名 `home-desktop.png` / `home-mobile.png` / `dashboard.png`（Task 1 / 2 / 3 一致）；端口探测列表 3000 / 5173 / 4200 / 8080 / 8000（Task 1 / 2 一致）；视口 1280×720 与 390×844（Task 1 / 2 / 6 一致）。
- [ ] **版本一致**：0.3.0 三处（marketplace.json / plugin.json / spec），README 标题行由脚本生成不手写。
