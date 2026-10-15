import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../docs/skills.json', import.meta.url), 'utf8'));

const OPEN = '<!-- auto:meta:count:begin -->';
const CLOSE = '<!-- auto:meta:count:end -->';
/** 渲染段在 index.html 里的稳定接缝，测试据此把脚本抠出来单独跑。 */
const MARK = '/* ---- skill list render (data-driven) ---- */';

function segmentBetween(open, close) {
  const a = html.indexOf(open);
  const b = html.indexOf(close);
  assert.ok(a > -1, `缺少锚点 ${open}`);
  assert.ok(b > a, `锚点顺序不对：${close} 应在 ${open} 之后`);
  return html.slice(a, b);
}

// ---- 静态结构 ----

test('meta 锚点注释存在且包裹 4 行数字', () => {
  assert.ok(html.includes(OPEN));
  assert.ok(html.includes(CLOSE));
  const seg = html.split(OPEN)[1].split(CLOSE)[0];
  assert.ok(seg.includes('name="description"'));
  assert.ok(seg.includes('og:description'));
});

test('硬编码的 skill-row 已清空，改为运行时容器', () => {
  assert.ok(html.includes('id="skill-list"'));
  assert.ok(html.includes('id="skill-filters"'));
  assert.equal((html.match(/class="skill-row"/g) || []).length, 0,
    '不应再有硬编码 skill-row');
});

test('不再有 homepage-craft v0.1.0 这类漂移数字', () => {
  assert.ok(!html.includes('homepage-craft</span>\n'), '不应硬编码 skill 名称');
});

test('详情面板样式与渲染函数存在', () => {
  assert.ok(html.includes('.skill-detail'));
  assert.ok(html.includes('renderDetail'));
  assert.ok(html.includes('__renderSkills'));
});

test('内联技能数据优先于 fetch，双击打开也能看到列表', () => {
  assert.ok(
    html.includes('<script type="application/json" id="skill-data">'),
    '主页应含内联数据 script 块',
  );
  assert.ok(html.includes('inline && inline.textContent.trim()'), '渲染逻辑应优先读内联数据');
  assert.ok(!html.includes("protocol === 'file:'"), '不应再有 file:// 提前 return 的分支');
});

// ---- 数量表述：锚点区内 / 汉字数词 / 运行时注入 ----

test('「N 个技能」只出现在 meta 锚点区间内，其余位置交给脚本或改写', () => {
  // fm-card 的 aria-label、hero 的 eyebrow 都在锚点区外，脚本够不着，
  // 留着就会是下一个漂移源。
  const outside = html.slice(0, html.indexOf(OPEN)) + html.slice(html.indexOf(CLOSE) + CLOSE.length);
  assert.equal(outside.match(/\d+\s*个技能/g), null,
    `锚点区外不该有「N 个技能」：${JSON.stringify(outside.match(/\d+\s*个技能/g))}`);
});

test('标题不再用汉字数词复述技能数量', () => {
  assert.equal(html.match(/[一二三四五六七八九十两]\s*个\s*技能/g), null,
    '「五个技能」这类写法脚本正则认不出，只能靠改文案根除');
  assert.ok(html.includes('<h2 id="skills-h2">全部技能</h2>'));
  assert.ok(html.includes('<h1>一套技能，一条命令，'), 'hero 主标题应改为不含数量的说法');
});

test('首屏两处技能数量由 skills.json 注入，不写死在标记里', () => {
  assert.ok(html.includes('id="hero-skill-count"'), 'eyebrow 的数量需要留注入点');
  assert.ok(html.includes('id="fm-skill-count"'), 'fm-card 的 skills: 数量需要留注入点');
  assert.equal(html.match(/<span class="sep">·<\/span>\d+\s*skills/g), null,
    'eyebrow 里的数字必须被注入点取代');
  // 注入点在 __renderSkills 里按 payload.count 覆写
  assert.ok(html.includes("getElementById('hero-skill-count')"), '注入代码应命中 eyebrow 节点');
  assert.ok(html.includes("getElementById('fm-skill-count')"), '注入代码应命中 fm-card 节点');
});

test('shelf-note 不再手写「与 marketplace.json 实时一致」的维护承诺', () => {
  assert.ok(!html.includes('实时一致'));
});

test('零依赖：没有外链脚本或 CDN 框架', () => {
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  for (const s of scripts) {
    assert.ok(!/\bsrc=/.test(s), `不应有外链脚本：${s}`);
  }
});

// ---- 渲染逻辑：用最小 DOM 桩真跑一遍 ----

function createNode(tag) {
  const node = {
    tagName: String(tag).toUpperCase(),
    className: '',
    hidden: false,
    style: {},
    attrs: {},
    children: [],
    handlers: {},
    _text: '',
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); },
    appendChild(child) { this.children.push(child); return child; },
    remove() {},
    select() {},
  };
  // 真实 DOM 里写 textContent 会清空子节点；桩要复刻这个语义，
  // 否则重渲染（切分类）会越堆越多，测不出问题。
  Object.defineProperty(node, 'textContent', {
    get() { return this._text + this.children.map((c) => c.textContent).join(''); },
    set(v) { this._text = v == null ? '' : String(v); this.children.length = 0; },
  });
  node.querySelector = (sel) => findByTag(node, sel);
  return node;
}

function findByTag(node, sel) {
  const want = sel.toUpperCase();
  for (const c of node.children) {
    if (c.tagName === want) return c;
    const hit = findByTag(c, sel);
    if (hit) return hit;
  }
  return null;
}

function allText(node) {
  return node._text + node.children.map(allText).join('');
}

/** 抠出 index.html 里的渲染段，在 Node 里用桩件执行。 */
function loadRenderer({ protocol = 'http:', fetchImpl, inlineData = null } = {}) {
  const start = html.indexOf(MARK);
  assert.ok(start > -1, `index.html 缺少渲染段标记 ${MARK}`);
  // 渲染段结束于它自己的 </script>；页面末尾还有内联数据块，
  // 不能用 lastIndexOf('</script>')，那会把数据块也吃进来。
  const source = html.slice(start + MARK.length, html.indexOf('</script>', start));
  const errorBox = createNode('div');
  errorBox.appendChild(createNode('p')); // 真实 DOM 里是 <p class="shelf-note">
  const nodes = {
    'skill-list': createNode('div'),
    'skill-filters': createNode('div'),
    'skill-load-error': errorBox,
  };
  // inlineData 默认取主页里真实内联的那份 JSON（构建期注入）。
  const inlineNode = createNode('script');
  if (inlineData === null) {
    const real = /<script type="application\/json" id="skill-data">([\s\S]*?)<\/script>/.exec(html);
    assert.ok(real, 'index.html 应含内联技能数据 script 块');
    inlineNode._text = real[1].trim();
  } else {
    inlineNode._text = inlineData;
  }
  nodes['skill-data'] = inlineNode;
  const doc = {
    body: createNode('body'),
    getElementById: (id) => nodes[id] ?? null,
    createElement: createNode,
  };
  const win = { isSecureContext: true };
  const fetchStub = fetchImpl || (() => Promise.reject(new Error('fetch 未注入')));
  const render = new Function(
    'document', 'window', 'location', 'navigator', 'fetch', 'setTimeout', 'console',
    `${source}\nreturn window.__renderSkills;`,
  )(doc, win, { protocol }, { clipboard: null }, fetchStub, () => {}, { error: () => {} });
  return { render, nodes, doc, win };
}

test('file:// 下靠内联数据渲染，不发请求、不显示错误提示', () => {
  let called = 0;
  const { nodes } = loadRenderer({
    protocol: 'file:',
    fetchImpl: () => { called++; return Promise.resolve({ ok: true, json: async () => ({ count: 0, skills: [] }) }); },
  });
  assert.equal(called, 0, 'file:// 下有内联数据就不该走 fetch');
  assert.equal(nodes['skill-load-error'].hidden, true, '有内联数据时不该显示错误提示');
  assert.equal(nodes['skill-list'].hidden, false, '列表应可见');
  assert.equal(nodes['skill-list'].children.length, 5, 'file:// 下也应渲染出 5 个 skill');
});

test('内联数据为空时回落 fetch', async () => {
  let called = 0;
  const { nodes } = loadRenderer({
    protocol: 'http:',
    inlineData: '   ',
    fetchImpl: () => {
      called++;
      return Promise.resolve({ ok: true, json: async () => ({ count: 1, categories: [], skills: [{ name: 'x', version: '1.0.0', category: 'design', description: 'd', triggers: [], triggerSource: 'none', antiTriggers: [], references: [], url: 'u', installCmd: 'c' }] }) });
    },
  });
  await new Promise((r) => setImmediate(r));
  assert.equal(called, 1, '内联为空应回落到 fetch');
  assert.equal(nodes['skill-list'].children.length, 1);
});

test('内联 JSON 损坏时不崩、也不白屏，回落到 fetch', async () => {
  let called = 0;
  const { nodes } = loadRenderer({
    protocol: 'http:',
    inlineData: '{ 这不是 JSON',
    fetchImpl: () => {
      called++;
      return Promise.resolve({ ok: true, json: async () => ({ count: 0, categories: [], skills: [] }) });
    },
  });
  await new Promise((r) => setImmediate(r));
  assert.equal(called, 1, '损坏的内联数据应回落到 fetch');
  assert.equal(nodes['skill-load-error'].hidden, true, 'fetch 成功后不该报错');
});

test('真实 skills.json 全量渲染：条数、名称、链接都对得上', () => {
  const { render, nodes } = loadRenderer();
  render(data);
  assert.equal(nodes['skill-list'].children.length, data.skills.length);
  const text = allText(nodes['skill-list']);
  for (const s of data.skills) {
    assert.ok(text.includes(s.name), `列表缺 ${s.name}`);
    assert.ok(text.includes(s.installCmd), `缺 ${s.name} 的安装命令`);
  }
});

test('triggerSource=none（空触发词）不渲染触发词那一行', () => {
  const payload = {
    count: 1,
    categories: ['design'],
    skills: [{
      name: 'x', version: '1.0.0', category: 'design', keywords: [],
      description: '一句描述', triggers: [], triggerSource: 'none', antiTriggers: [],
      references: [], url: 'https://example.com/x', installCmd: 'mavis skill install https://example.com/x',
    }],
  };
  const { render, nodes } = loadRenderer();
  render(payload);
  const text = allText(nodes['skill-list']);
  assert.ok(text.includes('一句描述'));
  assert.equal(/触发词/.test(text), false, '空触发词不该留一个空标签');
  assert.equal(/不适用场景/.test(text), false, '空反触发不该留一个空标签');
  assert.equal(/refs/.test(text), false, '零 references 不该显示 0 refs');
});

test('triggerSource=readme 回落来的触发词照常渲染', () => {
  const payload = {
    count: 1,
    categories: ['design'],
    skills: [{
      name: 'x', version: '1.0.0', category: 'design', keywords: [],
      description: '描述', triggers: ['来自 README 的词'], triggerSource: 'readme',
      antiTriggers: [], references: [], url: 'https://example.com/x', installCmd: 'cmd',
    }],
  };
  const { render, nodes } = loadRenderer();
  render(payload);
  assert.ok(allText(nodes['skill-list']).includes('来自 README 的词'));
});

test('带残缺引号的 antiTriggers 按纯文本渲染，不会打断 DOM', () => {
  const payload = {
    count: 1,
    categories: ['design'],
    skills: [{
      name: 'x', version: '1.0.0', category: 'design', keywords: [],
      description: '描述', triggers: [], triggerSource: 'none',
      antiTriggers: ['通用前端开发或任意 UI 设计（不是"仓库'],
      references: [], url: 'https://example.com/x', installCmd: 'cmd',
    }],
  };
  const { render, nodes } = loadRenderer();
  render(payload);
  assert.ok(allText(nodes['skill-list']).includes('通用前端开发或任意 UI 设计（不是"仓库'),
    '残缺引号的条目应原样显示');
});

test('描述里的 HTML 片段只当文本，不生成元素', () => {
  const payload = {
    count: 1,
    categories: ['design'],
    skills: [{
      name: 'x', version: '1.0.0', category: 'design', keywords: [],
      description: '<img src=x onerror=alert(1)>', triggers: [], triggerSource: 'none',
      antiTriggers: [], references: [], url: 'https://example.com/x', installCmd: 'cmd',
    }],
  };
  const { render, nodes } = loadRenderer();
  render(payload);
  assert.ok(allText(nodes['skill-list']).includes('<img src=x onerror=alert(1)>'));
  assert.equal(findByTag(nodes['skill-list'], 'img'), null, '不该凭空长出 img 元素');
});

test('分类筛选：条数、aria-pressed 与过滤结果联动', () => {
  const { render, nodes } = loadRenderer();
  render(data);
  const chips = nodes['skill-filters'].children;
  assert.equal(chips.length, data.categories.length + 1, '应有「全部」+ 每个分类');
  assert.equal(chips[0].textContent, '全部');
  assert.equal(chips[0].getAttribute('aria-pressed'), 'true');
  const design = chips.find((c) => c.textContent === 'design');
  const expected = data.skills.filter((s) => s.category === 'design').length;
  design.handlers.click[0]();
  assert.equal(nodes['skill-list'].children.length, expected, '筛选后应只留该分类');
  // 筛选后整条筛选条会重建，必须重新取节点，不能拿旧的被摘下来的节点断言
  const designAgain = nodes['skill-filters'].children.find((c) => c.textContent === 'design');
  assert.equal(designAgain.getAttribute('aria-pressed'), 'true');
  assert.equal(nodes['skill-filters'].children[0].getAttribute('aria-pressed'), 'false');
  nodes['skill-filters'].children[0].handlers.click[0]();
  assert.equal(nodes['skill-list'].children.length, data.skills.length, '切回「全部」应复原');
});

test('分类筛选可用键盘激活（给了 tabindex 就得能回车/空格）', () => {
  const { render, nodes } = loadRenderer();
  render(data);
  const chip = nodes['skill-filters'].children.find((c) => c.textContent === 'design');
  assert.equal(chip.getAttribute('tabindex'), '0');
  assert.equal(typeof chip.handlers.keydown[0], 'function', '缺少键盘处理器');
  let prevented = false;
  chip.handlers.keydown[0]({ key: 'Enter', preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true, '激活后应阻止默认行为，否则空格会滚动页面');
  assert.equal(nodes['skill-list'].children.length,
    data.skills.filter((s) => s.category === 'design').length, '回车应等同点击');
});

test('渲染段不使用 innerHTML / document.write', () => {
  // 先剥注释：段内注释会解释「为什么不用 innerHTML」，不该把自己判成违规
  const source = html.slice(html.indexOf(MARK), html.lastIndexOf('</script>'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  assert.equal(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(source), false,
    '一律走 textContent，顺带防 XSS 与引号问题');
});

test('skills.json 缺字段时页面不崩（数组类字段兜底）', () => {
  const payload = { count: 1, skills: [{ name: 'y', version: '0.1.0', description: 'd', url: 'u', installCmd: 'c' }] };
  const { render, nodes } = loadRenderer();
  render(payload);
  assert.ok(allText(nodes['skill-list']).includes('y'));
});
