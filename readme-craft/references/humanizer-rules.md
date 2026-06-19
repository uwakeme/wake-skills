# 反 AI 味规则（README 专属）

> 本文件是 `readme-craft` 的人性化质控参考。
> - SKILL.md 规定**做什么**
> - `gfm-syntax.md` 规定**语法怎么写**
> - **本文件规定"不要写成什么样"**——把人类作者少用、AI 偏爱的 24 种模式筛出 README 场景下最容易踩的 12 种，给出反例 → 正例对照。

## 适用范围

**只针对人类读得多的正文**。技术性参数表（API、命令、env vars）允许保留表格、符号、列对齐——读者在查参数不是在读故事。

| 区域 | 是否应用本规则 |
| --- | --- |
| About / Features / Quick Start 正文 / Contributing / Acknowledgments | ✅ 严格执行 |
| Features / Usage / Configuration 的描述性段落 | ✅ 严格执行 |
| 标题、徽章行、代码块、表格元数据、参考链接区 | ❌ 不适用 |
| API / Commands / Endpoints 的参数表 | ❌ 不适用（保留技术符号） |

---

## 12 条反 AI 味硬规则

### 1. 标题不带 emoji

❌ AI 味：
```markdown
## ✨ 功能特性
## 🚀 快速开始
## 🛠️ 技术栈
## 🗺️ 路线图
```

✅ 人味：
```markdown
## 功能特性
## 快速开始
## 技术栈
## 路线图
```

**规则**：标题只用文字。emoji 要放就放正文，每篇 README 不超过 3 个，且只放在 Features 段。

---

### 2. Features 不用「粗体短句 + 冒号 + 描述」inline-header 列表

❌ AI 味（你那份 README 的实际样子）：
```markdown
- 🗄️ **多数据库支持**：内置 MySQL 8、Oracle 21、SQL Server 12 三个驱动，切换即用
- 📦 **双 ORM 模板**：MyBatis 与 MyBatis-Plus 各一套独立模板，按需选择
- 🎨 **可定制模板**：所有 `.ftl` 模板都在 `src/main/resources/templates/`，改完即生效
- ⚙️ **细粒度选项**：包名、作者、Lombok、Swagger 注解、字段注释、覆盖策略自由开关
- 🧱 **可扩展代码风格**：内置两种代码风格（`CodeStyle`），未来按 `CodeStyle` 接口扩展即可
```

✅ 人味（一句话 + 短细节）：
```markdown
- 支持 MySQL 8 / Oracle 21 / SQL Server 12，切换即用
- MyBatis 和 MyBatis-Plus 各自一套独立模板
- 改 `.ftl` 模板立即生效，下一次生成立刻反映
- 包名、作者、Lombok、Swagger 注解都能在 GUI 里勾选
- 代码风格枚举化，要加新风格实现 `CodeStyle` 接口就行
```

**规则**：bullet 第一行尽量是一句话。粗体短句 + 冒号这种"伪标题"是 AI 最爱用的列表模式之一，**禁止全文出现**。

---

### 3. 破折号「——」节制使用

❌ AI 味（你那份 README 第 65 行）：
```markdown
它解决的问题很简单——
> 每次新表都要重复一遍 `Entity` + `Mapper` + `XML` + `Service` + `Impl` + `Controller` 的样板代码...
```

✅ 人味：
```markdown
它解决的问题很简单：每次新表都要把 `Entity` / `Mapper` / `XML` / `Service` / `Impl` / `Controller` 抄一遍。
```

**规则**：一篇 README 破折号 < 5 个。能用句号、逗号、冒号替代的就替代。破折号**只用于"插入说明"或"口语化转折"**，不当句末标点用。

---

### 4. 不用 "It's not just X, it's Y" 伪对仗

❌ AI 味：
```markdown
它不仅是个工具，更是一套完整的代码生成哲学。
Code Generator 不仅支持 MyBatis，更是覆盖了 MyBatis-Plus 的全场景。
```

✅ 人味：
```markdown
它生成 6 个文件：Entity / Mapper / Service / ServiceImpl / Controller / MapperXML。
```

**规则**：去掉"不仅/更"句式。要说"全面"就直接列出具体是什么。

---

### 5. 不用 "from X to Y" 伪范围

❌ AI 味：
```markdown
从模板选择到代码生成，从数据库连接到批量处理，为你提供一站式体验。
```

✅ 人味：
```markdown
从选表到生成一整个模块，大概 1 分钟。
```

**规则**：要么真的按时间/步骤展开，要么只说做了什么。"全方位、一站式、全流程"是 AI 八股套话，直接删。

---

### 6. 替换 AI 高频词

| ❌ 别用 | ✅ 用 |
| --- | --- |
| Additionally | 同时 / 还有 |
| Moreover | 而且 / 顺便说 |
| It is important to note that | 注意 / 需要说明的是 |
| It is worth mentioning that | 顺便提一下 |
| In conclusion | 总结一下 / 最后 |
| However | 但 / 不过 |
| Therefore | 所以 / 因此 |
| Furthermore | 而且 / 再说 |
| delves into | 介绍 / 聊 / 讲 |
| showcasing | 体现 / 展示 |
| testament to | 证明 / 说明 |
| pivotal | 关键 / 重要 |
| landscape (抽象用法) | 领域 / 行业 / 这块 |
| vibrant | 活跃 / 红火 |
| seamless | 顺 / 不卡 |
| intuitive | 直观 / 一看就会 |
| powerful | 强 / 能打 |
| robust | 稳 / 健壮 |
| elegant | 干净 / 漂亮 |
| commitment to | 在乎 / 坚持 |
| serves as | 是 / 作为 |
| boasts | 有 / 提供 |
| features | 有 / 自带 |
| offers | 提供 / 有 |
| stands as | 是 / 作为 |
| highlights (verb) | 体现 / 显示 |

**规则**：写完用 `Select-String` 在最终 README 里搜这些词，能换成人话的都换。

---

### 7. 不用 "serves as / boasts / features / offers" 替代 "是/有/能"

❌ AI 味：
```markdown
Code Generator 是一款基于 JavaFX 的桌面端代码生成器，提供了多数据库支持能力。
```

✅ 人味：
```markdown
Code Generator 是一个用 JavaFX 写的桌面工具，支持 MySQL / Oracle / SQL Server。
```

**规则**：用"是"、"有"、"能"。AI 喜欢用"作为 / 拥有 / 提供 / 自带"来"显得高级"，全是冗余。

---

### 8. 避免 -ing 伪深度尾巴

❌ AI 味：
```markdown
它的模块化设计便于扩展，体现了以用户为中心的设计理念，突出了对开发者体验的重视。
```

✅ 人味：
```markdown
它模块化得不错，要加新功能改改代码就行。
```

**规则**：去掉"体现了...突出了...展现了...彰显了..."。这种同义堆叠是 AI 制造"深度"的最常见手法。

---

### 9. 不用推销腔

❌ AI 味：
```markdown
终极代码生成体验。释放你的开发潜能。极致性能，匠心打造。
```

✅ 人味：
```markdown
跑一个 30 张表的库，1 分钟内出 180 个文件。
```

**规则**：用具体数字、具体场景替换"极致、完美、终极、匠心、赋能、释放、颠覆"。

---

### 10. 不用抽象大词 + 形容词三连

❌ AI 味：
```markdown
本项目以其创新的设计理念、深度的技术积累，为开发者提供了一个强大的、可靠的、高效的解决方案。
```

✅ 人味：
```markdown
本项目用 MyBatis-Plus + Freemarker 写，已经稳定跑了 2 年。
```

**规则**：一句话里形容词不超过 1 个。出现"创新 / 深度 / 强大 / 可靠 / 高效 / 智能"超过 3 个，几乎一定是 AI 写的。

---

### 11. 句子长度有节奏

❌ AI 味（机关枪）：
```markdown
它支持多数据库。它支持多 ORM。它支持模板定制。它支持路径命名。它支持批量生成。
```

✅ 人味：
```markdown
它支持 MySQL / Oracle / SQL Server 三种数据库，MyBatis 和 MyBatis-Plus 两套模板。所有 `.ftl` 模板都能直接改，保存即生效。一次还能勾多张表批量生成。
```

**规则**：避免"一句一事实"机关枪。能合并就合并。长短句交替：短句放重点，长句放细节。

---

### 12. 结尾不说空话

❌ AI 味：
```markdown
未来可期，让我们一起期待 Code Generator 在未来的精彩表现！

感谢您的使用，希望本工具能为您的工作带来便利。
```

✅ 人味（直接说下一步）：
```markdown
下一步：补单元测试和模板渲染快照测试，欢迎 PR。
```

**规则**：用具体下一步替换"未来可期 / 让我们一起 / 期待您的反馈"。Acknowledgments 段可以保留"灵感来自..."这种带感情的句子，结尾段不行。

---

## 写完后的 self-check 清单

```markdown
- [ ] 标题没有 emoji
- [ ] Features/列表段没有"粗体短句 + 冒号"格式
- [ ] 全文破折号 < 5 个
- [ ] 搜过 AI 高频词表（Additionally, Moreover, pivotal, seamless, robust...）
- [ ] 没有 "serves as / boasts / features / offers" 替代词
- [ ] 没有"体现了...突出了..." -ing 堆叠
- [ ] 句子长度有变化（短句 + 长句交替）
- [ ] 没有"标志着 / 象征着 / 一站式"空话
- [ ] 没有 "It's not just X, it's Y" 句式
- [ ] 一句话里形容词 ≤ 1 个
- [ ] 结尾说"下一步做什么"而不是"未来可期"
```

---

## 附录 A：完整 AI 句式 → 人话对照

| AI 句式 | 人话 |
| --- | --- |
| "我们致力于提供..." | "这个工具做 X" |
| "释放你的潜能" | 删掉 |
| "体验前所未有的便捷" | 删掉 |
| "全方位满足你的需求" | 删掉 |
| "打造极致体验" | 删掉 |
| "在 X 的道路上迈出了坚实的一步" | "这个版本加了 X" |
| "我们始终坚持 X" | 删掉，直接说做了 X |
| "为你带来 X" | "你得到 X" |
| "我们相信..." | "我觉得..." |
| "未来可期" | "下面这些是计划" |
| "期待您的反馈" | 删掉 |
| "标志着 / 象征着 / 见证了" | 用具体时间/数字/对比替换 |
| "匠心打造 / 倾力奉献" | 删掉 |
| "一站式 / 全方位 / 全流程" | 直接说做了什么 |
| "深耕 X 领域" | "做了 X 项目" |

---

## 附录 B：可保留的"AI 友好"结构

下面这些**不是 AI 味**，是 README 工程实践，照常用：

- ✅ Shields 徽章行
- ✅ TOC 折叠
- ✅ 表格列对齐
- ✅ 代码块带语言
- ✅ `> [!NOTE]` / `> [!TIP]` Alerts（**只在技术性补充**用，不在 Features 段用）
- ✅ Quick Start 的 `bash` 命令块
- ✅ Architecture 段的 mermaid / ascii 图
- ✅ Roadmap 段的复选框 `- [x]` / `- [ ]`
- ✅ 表格化的 Configuration / API endpoints

这些结构**提高可读性**，跟"AI 味"无关。

---

## 参考

- `humanizer` skill（`~/.mavis/skills/humanizer/SKILL.md`）— 24 种 AI 写作模式完整版，基于 Wikipedia "Signs of AI writing"
- 本文件是该 skill 在 README 场景下的精简 + 实操版
