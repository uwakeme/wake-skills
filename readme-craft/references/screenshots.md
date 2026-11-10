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

---

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

---

## 候选集（默认 4 张）

| 候选 | 视口 | 手段 | 说明 |
| --- | --- | --- | --- |
| 首页 | 1280×720 桌面 | 内置浏览器（降级：无头 Chrome） | 主视觉，最重要的一张 |
| 首页 | 390×844 移动 | **只能无头 Chrome** | 展示响应式表现 |
| 关键子页面 ×1-2 | 1280×720 桌面 | 内置浏览器（降级：无头 Chrome） | 从首页导航栏的链接里找 |

---

## 拍摄手段（能力阶梯，取第一条命中的）

### 路径 A：内置浏览器（桌面候选首选）

能交互（点导航、填表单）、能复用登录态。

1. 先加载 browser 技能（browser-use:control-in-app-browser），它是**会话级前置**，不加载就调不动浏览器
2. `open_tab` 打开 `http://127.0.0.1:<port>/`
   - ⚠️ 当前标签页已有内容时 `navigate` 会报 `CURRENT_TAB_OCCUPIED` ⇒ **用 `open_tab`**
3. 等页面稳定（SPA 要等水合，否则拍到加载态）
   - ⚠️ **实测**：`open_tab` 后立刻截图，拍到的是**加载态**（"booting"），不是水合后的内容
   - ⇒ 先 `wait`（参数是 **`timeout`**，不是 `duration`）再截图：`{"action":"wait","input":{"timeout":3000}}`
4. `screenshot`（`scope: "viewport"`）⇒ 返回 `userDelivery.filePath`
   - ⚠️ 截图动作**只接受 `scope`**，传 `path` 会报错 ⇒ 产物落在运行时目录，**必须拷进项目**
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

---

## 交用户挑

- 候选图**逐张交付**给用户（媒体交付），配编号 + 一句话说明（哪一页、哪个视口）
- 用 `ask_user` 让用户选：保留哪几张 / 全要 / 全不要（选项即候选编号）
- **未选中的候选不落进项目**
- 用户不选 ⇒ 默认保留「首页桌面版」，报告里说明
- 全部不要 ⇒ 不写 Screenshots 章节，README 其余照常

---

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
| 拍出来是空白 / 加载态 | 先 `wait` 再重拍一次；仍不行则弃用该候选（实测：浏览器立刻截图会拍到加载态） |
| 用户中途说「不要截图了」 | 删掉已落盘的截图 + 移除 README 引用，不追问 |

---

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

---

## 反例

- ❌ 拍到加载态 / 白屏就当成品交上去
- ❌ 用 AI 生成图冒充真实界面截图
- ❌ 截图里带出真实邮箱 / 内部地址 / 用户数据
- ❌ 截图文件留在运行时目录，README 却引用了它（别人仓库里 404）
- ❌ 因为截图失败就不写 README
