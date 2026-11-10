# readme-craft 插图能力设计文档

- 日期：2026-11-10
- 状态：待用户评审
- 产物：`readme-craft` 技能升级（新增 Step 4.6「界面截图」+ `references/screenshots.md`）

## 1. 目标与边界

**目标**：让 readme-craft 在生成 README 时，能**自动拍下项目界面的真实截图**并嵌入 README 的 Screenshots 章节——截图由 agent 驱动浏览器实际渲染而来，不是占位图、不是 AI 生成图。

**边界**：

| 属于本设计 | 不属于本设计 |
| --- | --- |
| 拍真实界面截图并嵌入 README | banner（顶部 SVG）——那是 Step 4.5 的地盘，规则不变 |
| 自动拉起 dev server 让页面可访问 | 登录、鉴权、验证码——只截公开可见的部分 |
| 出多张候选让用户挑 | 多语言版本各拍一套——所有语言版本共用同一批图 |

**触发范围**：仅 **web-app / tutorial** 两类项目（Step 4 判定的项目类型）。library / API / CLI 没有界面可拍，直接跳过本步，不浪费启动成本。

## 2. 关键技术事实（已实测，不是推断）

设计前逐条验证过，全部在本机 Windows + Chrome 环境跑通：

| 事实 | 验证方式 | 结果 |
| --- | --- | --- |
| 内置浏览器能访问本地 dev server | `mcp_browser navigate` → `http://127.0.0.1:8731` | ✅ 正常渲染 |
| 浏览器截图会**落盘成真实文件** | `mcp_browser screenshot` 返回 `userDelivery.filePath` | ✅ 1280×720 PNG，20240 字节 |
| 落盘的 PNG 能拷进项目并读回 | `Copy-Item` → `read` 读回 | ✅ `image/png` 1280×720 |
| 浏览器截图**不支持指定输出路径** | 传 `path` 字段 | ❌ 报错，只接受 `scope` ⇒ 必须「拷进项目」这一步 |
| 无头 Chrome 可直接写文件 | `chrome --headless=new --screenshot=<path>` | ✅ 直写目标路径 |
| 无头 Chrome 能拍已水合的 SPA | `--virtual-time-budget=4000` + 1 秒后渲染的页面 | ✅ 拍到 "HYDRATED OK" |
| 无头 Chrome 能拍 localhost | `--screenshot` + `http://127.0.0.1:4311/` | ✅ 拍到 "LOCALHOST SPA READY" |
| 无头 Chrome 支持任意视口 | `--window-size=390,844` | ✅ 输出 390×844 |
| **内置浏览器视口是固定的** | 两次 `screenshot` 均返回 1280×720；工具契约里没有 resize / 设备模拟动作 | ❌ **拍不出移动端尺寸** ⇒ 移动端候选只能走无头 Chrome |
| dev server 能后台起、能被访问 | `npm run dev` 后台任务 → 探测端口 | ✅ 5173 返回 200 |
| 浏览器当前标签页被占用时 navigate 会失败 | 报 `CURRENT_TAB_OCCUPIED` | ⇒ 必须用 `open_tab`，这条要写进 reference |

**关键约束**：浏览器截图落在 `D:\Agent\.minimax\v2\assets\` 这类**运行时目录**，不在项目里 ⇒ 截图→拷进 `assets/screenshots/` 是必需环节，不是可选优化。

## 3. Step 4.6 执行流程

插在 Step 4.5（banner）之后、Step 5（撰写 README）之前。**截图失败不阻塞 README 主流程**——与 Step 4.5「锦上添花」的处理一致。

1. **判定是否适用**：Step 4 判定的项目类型不是 web-app / tutorial ⇒ 跳过本步，不问、不报告。
2. **探测 dev 命令**：从 manifest 读 `scripts.dev` / `scripts.start` / `scripts.serve`；同时探测常见端口（3000 / 5173 / 4200 / 8080 / 8000）是否已有服务在跑。
   - 已有服务在跑 ⇒ 直接用它，不重复启动。
3. **启动 dev server**：后台任务启动，等待端口就绪（轮询探测，超时上限约 60 秒）。
   - 起不来 / 没有 dev 命令 ⇒ **跳过本步**，README 其余部分照写，报告里说明原因。**绝不因此阻塞整个 README 流程。**
4. **拍候选**（见 §4）。
5. **交用户挑**（见 §5）。
6. **落盘**：选中的截图拷进 `<project-root>/assets/screenshots/`，按语义命名（如 `home-desktop.png`、`home-mobile.png`、`dashboard.png`）。
7. **关掉 dev server**：本步是自己起的 ⇒ 必须关；本来就在跑的不是自己起的 ⇒ **不要关**。
8. **写进 README**：Screenshots 章节引用 `./assets/screenshots/<name>.png`。

## 4. 候选集与拍摄手法

**默认拍 4 张**：

| 候选 | 视口 | 拍摄手段 | 说明 |
| --- | --- | --- | --- |
| 首页 | 1280×720 桌面 | 内置浏览器（降级：无头 Chrome） | 主视觉，最重要的一张 |
| 首页 | 390×844 移动 | **只能无头 Chrome**（浏览器视口固定，拍不出） | 展示响应式表现 |
| 关键子页面 ×1-2 | 1280×720 桌面 | 内置浏览器（降级：无头 Chrome） | 从页面导航里找（首页导航栏的链接） |

**手法分层**（能力阶梯，取第一条命中的）：

| 优先级 | 手段 | 何时用 | 产物落地方式 |
| --- | --- | --- | --- |
| 1 | **内置浏览器**（browser skill + `mcp_browser`） | 桌面候选的首选：能交互（点击导航、填表单）、能复用登录态 | 截图落运行时目录 ⇒ **拷进项目** |
| 2 | **无头 Chrome**（`--headless=new --screenshot`） | 无浏览器工具 / 浏览器起不来；**移动端候选的唯一手段** | **直写**目标路径 |
| 3 | 跳过 | 上面都不行 | 无图 |

> ⚠️ **视口限制**：内置浏览器视口固定 1280×720，无法改尺寸 ⇒ 移动端候选（390×844）**必须**用无头 Chrome。无头 Chrome 不可用时，移动端候选直接跳过，其余桌面候选照走。

**两条必须写进 reference 的实操细节**：

- 浏览器当前标签页有内容时，`navigate` 报 `CURRENT_TAB_OCCUPIED` ⇒ 用 `open_tab` 开新标签页。
- 页面是 SPA 时要等水合完成再拍，否则拍到的是加载态（无头 Chrome 用 `--virtual-time-budget`，内置浏览器用 `wait`）。

## 5. 交用户挑

- 候选图**逐张交付给用户**（媒体交付），配编号 + 一句话说明（拍的是哪一页、哪个视口）。
- 用 `ask_user` 让用户选：保留哪几张 / 全要 / 全不要。选项即候选编号。
- **未选中的候选不落进项目**（临时文件留在运行时目录，不进仓库）。
- 用户不选 ⇒ 默认保留「首页桌面版」这一张（保证 README 至少有一张真图），并在报告里说明。
- 全部不要 ⇒ 不写 Screenshots 章节，README 其余照常。

## 6. 降级与容错

| 情况 | 处理 |
| --- | --- |
| 项目类型不是 web-app / tutorial | 跳过本步，不报告 |
| 没有 dev 命令、也起不来 | 跳过截图，README 其余照写，报告说明原因 |
| dev server 起不来（依赖缺失 / 端口被占） | 同上，不阻塞 |
| 端口被别的进程占了 | 换端口重试一次；仍不行则跳过 |
| 页面要求登录 | 只截登录页以外的公开部分；不代填凭据 |
| 页面有验证码 | 跳过该页，不猜、不绕过 |
| 截图内容含隐私（邮箱 / 真实姓名 / 内部地址） | **不截**，换页面或跳过 |
| 浏览器工具不可用 | 降级到无头 Chrome |
| 无头 Chrome 也不可用 | 跳过本步 |
| 拍出来是空白 / 加载态 | 重拍一次（加等待）；仍不行则弃用该候选 |
| 用户中途说「不要截图了」 | 删掉已落盘的截图文件 + 移除 README 引用，不追问 |

## 7. 产物与目录

- 截图落 `<project-root>/assets/screenshots/`，**与 banner 的 `assets/banner.svg` 同级**。
- 理由（也是本次顺带修的历史不一致）：`references/templates.md` 里写的是 `images/screenshot.png`，而 banner 走 `assets/`——两处并存会让 agent 写到不存在的路径。本次统一到 `assets/`。
- README 引用写法：`![首页](./assets/screenshots/home-desktop.png)`。
- **所有语言版本共用同一批图**（图内无文字，语言中立），与 banner 的处理一致。

## 8. 仓库改动面（全套同步）

| 文件 | 改动 |
| --- | --- |
| `readme-craft/SKILL.md` | 新增 Step 4.6；Inputs 增加「是否截图」；Step 5 增加 Screenshots 章节写法；Failure handling 表补截图相关行；Output contract 补截图产物 |
| `readme-craft/references/screenshots.md` | **新增**：完整拍摄规范（流程、候选集、手段阶梯、实操细节、降级表、命名与嵌入） |
| `readme-craft/references/templates.md` | Screenshots 示例的路径从 `images/` 改为 `assets/screenshots/` |
| `.claude-plugin/marketplace.json` | readme-craft 版本 0.2.1 → 0.3.0；description 与 description_i18n 补上「可自动拍摄界面截图」 |
| `readme-craft/.claude-plugin/plugin.json` | version 0.2.1 → 0.3.0 |
| `README.md` | readme-craft 段落描述补一句截图能力（脚本生成的两行不动） |
| `CHANGELOG.md` | `## [Unreleased]` 下归 **Added** |

**触发词**：新增 `生成项目截图`、`README 里放界面截图`、`给项目拍截图`——让「只想拍图不写 README」的请求也能命中本 skill 的截图能力。

## 9. 验收标准

1. `npm run build` 干净退出，readme-craft 那行显示 `触发来源=skill-md 触发词=N`（N = 7 + 3 = 10）。
2. `npm run check` 退出码 0（无漂移）。
3. `npm test` 全绿（当前基线 69 个用例）。
4. 新 reference 被 `scripts/lib/extract.mjs` 的 `listReferences` 收录 ⇒ 主页上 readme-craft 的 references 列表出现 `screenshots.md`。
5. 人读检查：SKILL.md 里 Step 4.5 与 Step 4.6 的默认行为不冲突（banner 默认不问；截图默认出候选等用户挑——两条相反的默认行为必须各自写清，否则 agent 会记错）。
6. 端到端自检：在本仓跑一遍 Step 4.6 的流程（起 dev server → 拍 → 拷进 `assets/screenshots/` → 确认 README 引用路径真实存在），确认不是纸面流程。

## 10. 风险

| 风险 | 缓解 |
| --- | --- |
| dev server 起了关不掉（残留进程 / 占端口） | 记录自己起的进程，Step 6 明确要关；用后台任务 stop 而非杀端口 |
| 截图步骤拖慢 README 生成 | 只对 web-app / tutorial 触发；候选数封顶 4 张 |
| 候选挑-selection 打断自动化 | 用户可回「全要」或「全不要」；默认策略兜底（保留首页桌面版） |
| 仓库里混进隐私内容 | 截图内容含凭据 / 真实姓名 / 内部地址 ⇒ 不落盘 |
| agent 记错两条相反的默认行为 | §9.5 列为验收项；SKILL.md 里两条并排写，各自标注「默认不问 / 默认要问」 |
