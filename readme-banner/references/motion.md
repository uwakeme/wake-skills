# 动效规范

> 何时读：产出**带动画**的 banner 时必读。纯静态产物不用这个文件。
> 这份文件自包含——readme-craft 独立安装时也能用。

---

## 1. 交付格式：只有 SVG + CSS 动画

GitHub 渲染 README 里的 `<img src="x.svg">` 时，只清洗 `<script>` 和事件处理器，**`<style>` 与 `@keyframes` 会保留并真的播放**。

⇒ 动效一律用 SVG + CSS 动画交付。**不要**转 GIF / WebP / APNG 帧序列：体积通常几百 KB、不可编辑、还得保证帧间一致。

---

## 2. 元素分工

| 层 | 是否动 | 做法 |
|---|---|---|
| 装饰层（光带、括号、细线、扫描条） | 动 | 持续循环，周期 5–30s，各元素错峰 delay |
| 文字（标题 / 副标题 / 角标） | **只入场** | 一次性：淡入 + 8px 上移，0.6s，ease-out |
| 背景 | 不动 | — |

**文字不做持续循环**——持续动会抢注意力，也干扰阅读。

**风格母题**（与仓库视觉口径一致）：
- 文字**居中**排版
- **不要圆圈图案**（同心环、圆形装饰都不要）
- 装饰母题用**直线型**元素：斜向光带、扫描线、斜纹、直角括号

---

## 3. 三条硬性要求

### 3.1 首帧即完整可用

不播动画的阅读器（GitHub 移动端、邮件客户端、部分镜像站）看到的必须是完整 banner。

做法：每个动画元素**同时在元素属性上**写静态基线，不依赖 CSS 才可见。

```xml
<!-- 对：属性里有基线 opacity -->
<path class="an-brk" d="M40 78 V40 H78" opacity=".5"/>

<!-- 错：只在 CSS 里给 opacity -->
<path class="an-brk" d="M40 78 V40 H78"/>
```

### 3.2 降级规则必须能命中

```css
/* 对：选择器指向真实存在的类 */
@media (prefers-reduced-motion: reduce){
  .an-brk, .an-rule { animation: none !important; }
}
```

**反面教材**（真实踩过的坑）：写 `.an{animation:none}`，但元素实际类名是 `.an-b1` / `.an-b2` / `.an-rule` / `.an-brk` —— 选择器匹配不到任何元素，降级规则**从未生效**，而且从外观上完全看不出来。

⇒ 写完降级规则，**逐个核对类名与选择器是否一致**。

### 3.3 CSS transform 与 SVG transform 属性分离

CSS 的 `transform` 会**覆盖**同名的 SVG `transform` 属性。

```xml
<!-- 对：位移在外层 g（CSS），旋转在内层 rect（属性），两者复合 -->
<g class="an-band"><rect x="-260" y="52" width="980" height="104" fill="url(#g1)" transform="rotate(-15 640 160)"/></g>
```

```css
.an-band { animation: band 26s ease-in-out infinite; }
@keyframes band { 0%,100% { transform: translateX(-64px); } 50% { transform: translateX(64px); } }
```

---

## 4. 可复制的 keyframes 模板

```css
<style>
  /* 斜向柔光带漂移——最常用的装饰动效 */
  .an-b1 { animation: m-b1 26s ease-in-out infinite; }
  .an-b2 { animation: m-b2 34s ease-in-out infinite; }
  /* 细线呼吸 */
  .an-rule { animation: m-rule 5s ease-in-out infinite; }
  /* 直角括号呼吸 */
  .an-brk { animation: m-brk 7s ease-in-out infinite; }
  /* 错峰 delay：避免所有元素同步动作 */
  .d2 { animation-delay: .7s; } .d3 { animation-delay: 1.4s; } .d4 { animation-delay: 2.1s; }

  @keyframes m-b1 { 0%,100% { transform: translateX(-64px); } 50% { transform: translateX(64px); } }
  @keyframes m-b2 { 0%,100% { transform: translateX(64px); } 50% { transform: translateX(-64px); } }
  @keyframes m-rule { 0%,100% { opacity:.4; } 50% { opacity:1; } }
  @keyframes m-brk { 0%,100% { opacity:.28; } 50% { opacity:.8; } }

  /* 文字一次性入场——只跑一次，不循环 */
  .an-title { animation: m-title .6s ease-out both; }
  .an-sub { animation: m-sub .6s ease-out .15s both; }
  @keyframes m-title { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
  @keyframes m-sub { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

  /* 降级——类名必须与上面完全一致 */
  @media (prefers-reduced-motion: reduce){
    .an-b1,.an-b2,.an-rule,.an-brk,.an-title,.an-sub { animation: none !important; }
  }
</style>
```

**参数口径**：

| 项 | 取值 |
|---|---|
| 装饰层周期 | 5–30s（越慢越不干扰；推荐 20s 以上） |
| 缓动 | `ease-in-out`（装饰层）/ `ease-out`（文字入场） |
| 位移幅度 | ±64px 以内，别超过画布 1/8 |
| 文字入场 | 0.6s，位移 8px，opacity 0 → 1，`both` 保留终态 |
| 同屏动画元素 | ≤ 4 个 |
| 错峰 delay | 0.7s / 1.4s / 2.1s 递增 |

---

## 5. GitHub 渲染硬约束

| 禁止 | 原因 |
|---|---|
| `<script>` / 事件处理器 | GitHub 会清洗 |
| `<foreignObject>` | 整个 SVG 不渲染 |
| `xlink:href` / 外部资源引用 | 资源加载失败，图变空白 |
| CSS 变量 `var(--...)` | GitHub 不解析，颜色回退成黑 |
| `<image>` 嵌外部 PNG | 同上；只允许 base64 data URI |
| `<script>` 之外的 JS 运行时逻辑 | 无执行环境 |

字体栈（必须含中文回退）：

```xml
font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', Roboto, 'Helvetica Neue', Arial, sans-serif"
```

---

## 6. 压缩：必须用安全配置

**`npx svgo` 的默认配置会毁掉动效产物**：

| 现象 | 原因 |
|---|---|
| `@media (prefers-reduced-motion: reduce)` **整块消失** | `inlineStyles` 把类内联成 style 属性后，media 查询里的选择器失效并被清掉 |
| `role="img"` **被删** | `removeUnknownsAndDefaults` 把它当未知属性清理 |

动画本身还活着，但**降级规则与无障碍属性同时静默失效**——压缩后肉眼看不出来。

**安全配置**：写一个 `svgo.config.mjs`，然后 `npx svgo --config svgo.config.mjs`。

```js
// svgo.config.mjs
export default {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          inlineStyles: false,              // 保住 @media 与类选择器
          removeUnknownsAndDefaults: false, // 保住 role="img"
          cleanupIds: false,                // 保住 id / url(#…) 引用
          minifyStyles: false,              // 别改写选择器
        },
      },
    },
  ],
};
```

```bash
npx svgo --config svgo.config.mjs banner.svg -o banner.min.svg
```

压缩后**必检**：

```bash
grep -c 'prefers-reduced-motion' banner.min.svg   # 必须 ≥1
grep -c 'role="img"' banner.min.svg               # 必须 ≥1
```

> `svgo.config.mjs` 是**临时配置文件**，用完删掉，不要提交进仓库。

---

## 7. 验证：动效到底有没有在动

### 7.1 陷阱：不能靠截图时间差判断

`--virtual-time-budget` **不是 CSS 动画的时钟**——同一 SVG 在 120ms / 2600ms / 5000ms 三个预算下截出的是**同一帧**。用它做「隔几秒截两帧比差异」会得到「没动」的假结论。

同样地，**只比 PNG 文件哈希也不可靠**——同一画面在不同编码状态下哈希会变。

正确做法：**确定性定帧 + 像素差分**。

### 7.2 步骤

**第一步：注入暂停 + 负延迟，确定性定帧**

```bash
# 复制一份，注入覆盖规则；负延迟把动画定在指定相位
# 注意 !important：原规则的 animation 简写会把 animation-delay 重置为 0
```

注入到 `</style>` 之前：

```css
.an-b1,.an-b2,.an-rule,.an-brk { animation-play-state: paused !important; animation-delay: -3s !important; }
```

（把选择器换成该产物里**实际存在**的动画类名。）

> **Windows 上不要用内联 PowerShell 拼这类字符串**——嵌套引号与 `$t` 变量会被命令行解析吃掉，直接写成 `.ps1` 脚本文件执行：
>
> ```powershell
> # probe.ps1
> $t = Get-Content 'banner.svg' -Raw
> $sel = '.an-b1,.an-b2'
> function Write-Variant($delay, $out) {
>   $rule = $sel + ' { animation-play-state: paused !important; animation-delay: ' + $delay + 's !important; }'
>   $s = $t.Replace('</style>', $rule + "`n  </style>")
>   [IO.File]::WriteAllText($out, $s, (New-Object Text.UTF8Encoding($false)))
> }
> Write-Variant '0' 'f0.svg'
> Write-Variant '-3' 'f3.svg'
> ```
>
> ```bash
> powershell -NoProfile -ExecutionPolicy Bypass -File probe.ps1
> ```
>
> 用 `[IO.File]::WriteAllText` + `UTF8Encoding($false)` 而不是 `Set-Content -Encoding UTF8`——后者在 PS 5.1 会写 BOM，SVG 带 BOM 可能影响解析。

分别以 `animation-delay: 0s` 和 `animation-delay: -3s` 生成两份，各截一帧。

**第二步：无头截帧**

```bash
chrome --headless=new --disable-gpu --hide-scrollbars \
  --run-all-compositor-stages-before-draw --window-size=1280,320 \
  --virtual-time-budget=500 --screenshot=frame1.png file:///<绝对路径>/f0.svg
```

> `--run-all-compositor-stages-before-draw` **必须带**，否则截出的是固定首帧。
> `file://` 路径要写**绝对路径**并把反斜杠换成正斜杠。

**第三步：像素差分**

用 Chrome 的 canvas 做差分（无需额外依赖）：

```html
<!-- diff.html：把两张截图的 base64 填进 __B1__ / __B2__ -->
<!doctype html><body><script>
const load = (b) => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b; });
(async () => {
  const a = await load('__B1__'), c = await load('__B2__');
  const cv = document.createElement('canvas'); cv.width = a.width; cv.height = a.height;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(a, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
  g.clearRect(0, 0, cv.width, cv.height); g.drawImage(c, 0, 0);
  const db = g.getImageData(0, 0, cv.width, cv.height).data;
  let diff = 0, maxd = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.abs(da[i]-db[i]) + Math.abs(da[i+1]-db[i+1]) + Math.abs(da[i+2]-db[i+2]);
    if (d > 6) { diff++; if (d > maxd) maxd = d; }
  }
  document.title = 'DIFF=' + diff + ' MAX=' + maxd;
  document.body.textContent = 'DIFF=' + diff + ' MAX=' + maxd;
})();
</script></body>
```

```bash
chrome --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom file:///<绝对路径>/diff.html
```

### 7.3 判据

| 情况 | 差分像素 | 结论 |
|---|---|---|
| 有动效 | > 0（实测参考量级：480 / 409600 ≈ 0.12%） | 动效真在动 |
| 无动效 | 0 | 静态图 |

### 7.4 静态对照（必做）

同一套探针跑一张**静态** SVG，差分必须是 **0**。

这一步防的是「判定器本身坏了却报通过」。判定器历史上出过错两处（用哈希代替像素差分、拿 virtual-time 当动画时钟），静态对照是常设防线。

### 7.5 环境不具备时

没有 Chrome 或截不了帧时，**如实报告「动效未能实机验证」**，不要声称验证通过。此时至少人工核对：keyframes 语法正确、降级选择器能命中类名、首帧静态基线已写。

---

## 8. 常见错法速查

| 错法 | 后果 |
|---|---|
| 用 svgo 默认配置压缩 | 降级规则与 `role` 静默丢失 |
| `@media` 里写不存在的类名 | 降级从未生效 |
| 只在 CSS 里给 opacity，不写属性基线 | 不播动画的阅读器看到残图 |
| 位移和旋转都写在同一元素 | CSS transform 覆盖 SVG transform 属性，旋转丢失 |
| 文字做持续循环 | 抢注意力、干扰阅读 |
| 用 `--virtual-time-budget` 间隔截帧判断 | 假阴性，误判「没动」 |
| 只比 PNG 哈希 | 假阳性/假阴性，编码一变就误判 |
| 底图 base64 内嵌后还要求 <6KB | 达不到；B 路径动效产物走 <50KB |
