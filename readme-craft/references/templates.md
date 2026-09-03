# README 模板参考（按项目类型）

> 这份文档是 SKILL.md 的补充材料。SKILL.md 主文件只规定"做什么、按什么顺序"，这里给出"每个 section 实际怎么写"的样例和模板。
> 调用 skill 时按需 Load，不要默认全读。

## 0. 通用骨架（所有类型都要有）

```markdown
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]
[![Version][version-shield]][version-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/<user>/<repo>">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center"><project-name></h3>

  <p align="center">
    <one-line tagline>
    <br />
    <a href="https://github.com/<user>/<repo>"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/<user>/<repo>">View Demo</a>
    ·
    <a href="https://github.com/<user>/<repo>/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/<user>/<repo>/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#getting-started">Getting Started</a>
      <ul><li><a href="#prerequisites">Prerequisites</a></li>
          <li><a href="#installation">Installation</a></li></ul>
    </li>
    <li>…</li>
  </ol>
</details>
```

**关键点**：

- `<a id="readme-top"></a>` 必须放在最顶，给 back-to-top 链接用
- 徽章数量控制在 4–7 个，多了视觉杂乱
- 居中区域用 HTML `<div align="center">`，GFM 兼容
- TOC 用 `<details>` 折叠，长 README 不挤压视觉

---

## 1. Library / SDK 模板

**突出章节**：API 必写、Built With 必写、Usage 必须有最小示例

````markdown
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

> 一句话定位：解决什么 + 给谁用。

This library helps you do X without Y. 4-5 句讲清楚"为什么存在"。

Here's why this exists:
* Your time should be focused on solving your problem
* You shouldn't have to read the source to know how it works
* It should just work

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Node][Node.js]][Node-url]
* [![TypeScript][TypeScript.ts]][TypeScript-url]
* 只列项目实际依赖的核心框架

## Getting Started

### Prerequisites

* Node.js 18+
* pnpm / npm / yarn（按项目实际）

### Installation

```sh
npm install <package-name>
# 或
pnpm add <package-name>
```

## Usage

最小可运行示例（必须能跑通）：

```ts
import { foo } from '<package-name>'

const result = foo({ input: 'hello' })
console.log(result)
```

参考 `examples/` 目录看更多例子。

## API

| 函数 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- |
| `foo(input)` | `FooOptions` | `FooResult` | 主入口 |
| `bar(config)` | `BarConfig` | `Promise<void>` | 异步版本 |

每个 API 一句话讲"做什么、什么时候用"。

## Roadmap

- [x] Core API
- [x] TypeScript types
- [ ] Plugin system
- [ ] More examples

See the [open issues](https://github.com/<user>/<repo>/issues) for the full list.

## Contributing

Contributions are what make the open source community amazing. Any PRs welcome.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the <License> License. See `LICENSE.txt` for more information.

## Contact

Your Name - [@twitter_handle](https://twitter.com/<handle>) - email@example.com

Project Link: [https://github.com/<user>/<repo>](https://github.com/<user>/<repo>)

## Acknowledgments

* [Inspiration](https://example.com)
* [Related project](https://example.com)

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/<user>/<repo>.svg?style=for-the-badge
[contributors-url]: https://github.com/<user>/<repo>/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/<user>/<repo>.svg?style=for-the-badge
[forks-url]: https://github.com/<user>/<repo>/network/members
[stars-shield]: https://img.shields.io/github/stars/<user>/<repo>.svg?style=for-the-badge
[stars-url]: https://github.com/<user>/<repo>/stargazers
[issues-shield]: https://img.shields.io/github/issues/<user>/<repo>.svg?style=for-the-badge
[issues-url]: https://github.com/<user>/<repo>/issues
[license-shield]: https://img.shields.io/github/license/<user>/<repo>.svg?style=for-the-badge
[license-url]: https://github.com/<user>/<repo>/blob/master/LICENSE.txt
[product-screenshot]: images/screenshot.png
[Node.js]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[TypeScript.ts]: https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
````

---

## 2. CLI 模板

**突出章节**：Demo (asciinema / gif) 强烈建议、Commands 必写

````markdown
## Demo

[![asciicast](https://asciinema.org/a/<id>.svg)](https://asciinema.org/a/<id>)

或 gif：

![Demo](images/demo.gif)

## Usage

```sh
<cli-name> [command] [options]
```

## Commands

| 命令 | 别名 | 说明 |
| --- | --- | --- |
| `<cli> init` | `i` | 初始化一个新项目 |
| `<cli> build` | `b` | 编译 |
| `<cli> deploy` | `d` | 部署到默认 target |
| `<cli> config` | `cfg` | 查看/修改配置 |

每个命令单独写一个 `### <cli> <command>` 子节，列出参数、flag、示例。

### `<cli> build`

```sh
<cli> build --target=prod --out=./dist
```

| Flag | 简写 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `--target` | `-t` | 构建目标 | `dev` |
| `--out` | `-o` | 输出目录 | `./dist` |
| `--watch` | `-w` | 监听文件变化 | `false` |
````

---

## 3. Web App 模板

**突出章节**：Screenshots 必写、Tech Stack 必写、Deploy 必写

````markdown
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

> 截屏 + 一句话讲这是啥。

## Screenshots

| Home | Dashboard | Mobile |
| --- | --- | --- |
| ![home](images/screenshot-home.png) | ![dashboard](images/screenshot-dashboard.png) | ![mobile](images/screenshot-mobile.png) |

> 用表格对齐排版，比单独放更整齐。

## Features

**写法**：每条一句完整的话，把价值点说清楚；不要 inline-header（`**特性名**：描述`）。emoji 慎用，参考 `humanizer-rules.md` 第 1、2 条。

- 特性 1：能做什么，对用户意味着什么
- 特性 2：跟竞品/上一个版本的差别在哪
- 特性 3：什么场景下特别有用
- 特性 4：可选——性能/兼容性/可扩展性等

> ❌ 反例（`humanizer-rules.md` 第 2 条）：
> ```markdown
> - ⚡️ **极致性能**：采用最新算法，性能提升 100%
> - 🎨 **优雅设计**：UI 简洁大方，交互流畅
> ```

## Tech Stack

**Client:**
- React 18
- TypeScript
- Vite
- Tailwind CSS

**Server:**
- Node.js 20
- Hono / Express
- PostgreSQL

按"客户端 / 服务端 / 数据库 / 部署"分组写。

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 15+

### Run

```sh
# 1. 克隆
git clone https://github.com/<user>/<repo>.git
cd <repo>

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，至少填 DATABASE_URL

# 4. 启动数据库（docker compose 方式）
docker compose up -d postgres

# 5. 数据库迁移 + 种子
pnpm db:migrate
pnpm db:seed

# 6. 启动 dev server
pnpm dev
```

打开 http://localhost:3000 看到登录页就算成功。

## Environment Variables

| 变量 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 | — |
| `JWT_SECRET` | ✅ | 签名密钥 | — |
| `PORT` | ❌ | 服务端口 | `3000` |
| `LOG_LEVEL` | ❌ | 日志级别 | `info` |

## Deployment

按 Step 3 探测到的目标写：

### Docker

```sh
docker build -t <app>:latest .
docker run -p 3000:3000 -e DATABASE_URL=... <app>:latest
```

### Vercel / Netlify / Fly.io / Railway

1. 在平台 connect 这个 repo
2. 配置环境变量
3. 点 Deploy

## Tests

```sh
pnpm test         # unit
pnpm test:e2e     # e2e (Playwright)
pnpm typecheck    # tsc
```
````

---

## 4. API 服务模板

**突出章节**：Endpoints 表格必写、Auth 必写

````markdown
## About The Project

<一段讲 API 是干啥的>

## Features

**写法**：API 服务的 Features 通常是 4-6 条短能力，每条不超过一行。可以用 emoji 但不要每行都用，参考 `humanizer-rules.md` 第 1 条。

- JWT / OAuth 2.0 认证
- 接口级 Rate limiting
- 标准化 JSON 响应（统一错误码、分页结构）
- OpenAPI 3.0 文档（`/docs` 自动生成）

## Quick Start

```sh
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"xxx"}'
```

返回：
```json
{
  "token": "eyJhbGc...",
  "expires_in": 3600
}
```

## Authentication

所有受保护 endpoint 需要在 header 带 `Authorization: Bearer <token>`。

## Endpoints

### Auth

| Method | Path | 描述 | Auth |
| --- | --- | --- | --- |
| `POST` | `/v1/auth/register` | 注册 | ❌ |
| `POST` | `/v1/auth/login` | 登录返回 token | ❌ |
| `POST` | `/v1/auth/refresh` | 刷新 token | ✅ |

### Resources

| Method | Path | 描述 | Auth |
| --- | --- | --- | --- |
| `GET` | `/v1/users` | 列出用户 | ✅ |
| `POST` | `/v1/users` | 创建用户 | ✅ |
| `GET` | `/v1/users/:id` | 获取用户详情 | ✅ |
| `PATCH` | `/v1/users/:id` | 更新用户 | ✅ |
| `DELETE` | `/v1/users/:id` | 删除用户 | ✅ |

每个重要 endpoint 单独写一个子节，列 request/response 示例。

### `POST /v1/users`

**Request:**
```json
{
  "email": "user@example.com",
  "name": "User"
}
```

**Response (201):**
```json
{
  "id": "u_abc123",
  "email": "user@example.com",
  "name": "User",
  "created_at": "2026-01-15T10:00:00Z"
}
```

**Error responses:**
- `400` Invalid request body
- `409` Email already exists
````

---

## 5. Tutorial / Learning 模板

**突出章节**：What you'll learn、Prerequisites、Steps

````markdown
## About The Project

> 这份教程会带你从零开始……

You will learn:
- 技能 1
- 技能 2
- 技能 3

## Prerequisites

- 基础知识 A
- 基础知识 B
- 工具准备

## Steps

### Step 1: 准备工作

```sh
# 命令
```

> [!TIP]
> 提示：踩坑提醒

### Step 2: 第一个例子

```sh
# 命令
```

<details>
<summary>点击查看完整代码</summary>

```ts
// 完整代码
```

</details>

### Step 3: 进阶用法

……

## FAQ

### 报错 X 怎么办？

```bash
# 解决方法
```

### 性能优化建议？

……
````

---

## 6. 可选 section 写法速查

### 6.1 Alerts

```markdown
> [!NOTE]
> 给读者的小提示

> [!TIP]
> 技巧、窍门

> [!IMPORTANT]
> 必须知道的关键信息

> [!WARNING]
> 可能踩坑

> [!CAUTION]
> 高危操作，会丢数据那种
```

按需选用，不堆砌。

### 6.2 折叠长内容

````markdown
<details>
<summary>高级配置（点击展开）</summary>

```yaml
# 长配置
```

</details>
````

### 6.3 居中内容

```html
<div align="center">

内容（表格、徽章行、强调段落都可以）

</div>
```

### 6.4 表格内嵌徽章

| 技术 | 徽章 |
| --- | --- |
| React | ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) |

### 6.5 diff 展示

```diff
+ 新增
- 删除
! 注意
# 注释
```

### 6.6 复选框列表（Roadmap / TODO）

```markdown
- [x] 已完成
- [ ] 未完成
  - [ ] 子项
```

### 6.7 数学公式（KaTeX 风格，GitHub 原生支持）

```markdown
行内：$a^2 + b^2 = c^2$

行间：
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
```

> 不确定 GitHub 是否完整支持就别用，删掉比写错强。

---

## 7. 人类化措辞速查

| ❌ 学究腔 | ✅ 人类化 |
| --- | --- |
| This project is a comprehensive, enterprise-grade solution that leverages cutting-edge paradigms | A small, fast library for X |
| In order to facilitate the deployment of the application, it is recommended to execute the following commands | To run it: |
| The aforementioned functionality provides users with the ability to | You can now |
| Utilizing state-of-the-art methodologies | Using |
| This README serves as a comprehensive guide | This README |
| The user is required to | You need to / run |
| Implementations of this functionality are characterized by | This does |

保留项目个性的小技巧：
- 在 About 段加一句"我们为什么写它"——这是 AI 写不出来的部分
- Features 段少用 emoji、**不**用 inline-header bullets（详见 `humanizer-rules.md` 第 1、2 条）
- 在 Acknowledgments 写"灵感来自 X 项目"——这比冷冰冰的版本号有人味
- FAQ 段落用"我经常被问到的几个问题"开头
- 写一句"踩过的坑"或者"已知限制"，这是 AI 极少主动写的

---

## 8. 反例（避免这么写）

````markdown
# ❌ 段落式 Description，缺失结构
This is a project that does things. It has features. To install it, run install.
The API is documented here. License is MIT.

# ❌ 章节标题大小写不一致
## getting started
## Features
## INSTALLATION

# ❌ 代码块没有语言
```
npm install
git clone
```

# ❌ 徽章占位没替换
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://example.com)

# ❌ "TBD" 留坑不补
## Configuration
TBD
````

---

## 9. 底部引用区（必须）

不管哪种类型，文档末尾都要有 reference-style 引用区，把所有外链收口。格式：

```markdown
<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/<user>/<repo>.svg?style=for-the-badge
[contributors-url]: https://github.com/<user>/<repo>/graphs/contributors
[…]
```

这样：
1. 文档主体干净，所有长 URL 都在底部统一管理
2. 改一个 URL 不用全文搜索
3. 渲染时 GitHub 自动解析

如果 README 比较短（< 200 行，与 SKILL.md Step 6 自检口径一致），可以省 TOC，但引用区不要省。
