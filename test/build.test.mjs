import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buildSkillRecords,
  buildSkillsJson,
  injectMeta,
  injectReadme,
} from '../scripts/build-site-data.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('每个已登记 skill 都产出记录且字段齐全', () => {
  const { records, warnings } = buildSkillRecords(repoRoot);
  assert.equal(records.length, 5, 'marketplace.json 登记了 5 个 skill');
  for (const r of records) {
    assert.ok(r.name && r.version, `${r.name} 缺 name/version`);
    assert.ok(r.description.length > 0, `${r.name} 缺描述`);
    assert.ok(r.url.startsWith('https://github.com/'), `${r.name} url 不合法`);
    assert.ok(r.installCmd.includes(r.name), `${r.name} 安装命令缺仓库路径`);
  }
  assert.deepEqual(warnings, [], `不应有告警，实际：${warnings.join('; ')}`);
});

test('article-valuator 的触发词全部来自 SKILL.md，且是干净的 6 条', () => {
  const { records } = buildSkillRecords(repoRoot);
  const r = records.find((x) => x.name === 'article-valuator');
  assert.equal(r.triggerSource, 'skill-md', 'SKILL.md 已能给出全部触发词，不该回落 README');
  assert.equal(r.triggers.length, 6);
  assert.ok(!r.triggers.some((t) => t.includes('用户发来 URL')), '不应混入散文条件句');
  for (const t of r.triggers) {
    assert.ok(!/[\r\n]/.test(t), `触发词必须是单行：${JSON.stringify(t)}`);
    assert.ok(t.trim().length > 0, '不应有空触发词');
  }
});

test('readme-craft 的触发词来自 SKILL.md', () => {
  const { records } = buildSkillRecords(repoRoot);
  const r = records.find((x) => x.name === 'readme-craft');
  assert.equal(r.triggerSource, 'skill-md');
  assert.ok(r.triggers.includes('生成 README'));
});

test('references 来自目录实扫而非正文解析', () => {
  const { records } = buildSkillRecords(repoRoot);
  const r = records.find((x) => x.name === 'readme-craft');
  assert.deepEqual(r.references, [
    'banner.md', 'gfm-syntax.md', 'humanizer-rules.md', 'i18n.md', 'templates.md',
  ]);
  const banner = records.find((x) => x.name === 'readme-banner');
  assert.equal(banner.references.length, 3);
});

test('buildSkillsJson 的结构含 count / categories 且 skills 顺序与 records 一致', () => {
  const { records } = buildSkillRecords(repoRoot);
  const json = buildSkillsJson(records);
  assert.equal(json.count, 5);
  assert.deepEqual(json.categories, ['design', 'documentation', 'productivity']);
  assert.deepEqual(json.skills.map((s) => s.name), records.map((s) => s.name));
  assert.ok(json.repo.user && json.repo.repo, 'repo 信息应可用于拼安装链接');
});

test('url / installCmd 指向发布分支，而不是本地检出的特性分支', () => {
  const { records } = buildSkillRecords(repoRoot);
  const json = buildSkillsJson(records);
  const prefix = `https://github.com/${json.repo.user}/${json.repo.repo}/tree/${json.repo.branch}/`;
  for (const r of records) {
    assert.ok(r.url.startsWith(prefix), `${r.name} 应指向发布分支 ${json.repo.branch}，实际 ${r.url}`);
    assert.ok(r.installCmd.includes(prefix), `${r.name} 安装命令应指向发布分支`);
  }
});

test('injectMeta: 锚点缺失时原样返回并标 ok=false，不改 html', () => {
  const html = '<p>5 个技能</p>';
  const out = injectMeta(html, 9);
  assert.equal(out.ok, false);
  assert.equal(out.html, html, '锚点缺失时不得改动 html 一个字节');
});

test('injectMeta: 锚点存在时只替换锚点区间内的计数', () => {
  const html = '<p>5 个技能 <span>8 个技能</span></p>\n<!-- auto:meta:count:begin -->\n9 个技能\n<!-- auto:meta:count:end -->\n';
  const out = injectMeta(html, 5);
  assert.equal(out.ok, true);
  assert.ok(out.html.includes('<!-- auto:meta:count:begin -->\n5 个技能\n<!-- auto:meta:count:end -->'));
  assert.equal(out.html.match(/5 个技能/g).length, 2, '区间内外都应被替换为新计数');
});

test('injectReadme: 只改标题行版本与触发词行，手写描述段落原样保留', () => {
  const readme = [
    '## 当前 skill',
    '',
    '### [alpha](./alpha)',
    '',
    '这是手写的描述段落，含 **粗体** 与 `行内代码`。',
    '',
    '触发词：`旧词一`、`旧词二`。',
    '',
    '### [beta](./beta)',
    '',
    'beta 的手写描述。',
    '',
    '触发词：`beta 旧词`。',
    '',
    '## 安装',
    '',
    '尾部内容不该被动。',
    '',
  ].join('\n');
  const records = [
    { name: 'alpha', version: '1.2.3', triggers: ['新词一', '新词二'] },
    { name: 'beta', version: '0.4.0', triggers: ['beta 新词'] },
  ];
  const out = injectReadme(readme, records);
  assert.ok(out.includes('### [alpha](./alpha) `v1.2.3`'), '标题行应带版本号');
  assert.ok(out.includes('### [beta](./beta) `v0.4.0`'));
  assert.ok(out.includes('触发词：`新词一`、`新词二`。'), '触发词行应被整体替换');
  assert.ok(out.includes('触发词：`beta 新词`。'));
  assert.ok(!out.includes('旧词一') && !out.includes('beta 旧词'), '旧触发词应被清掉');
  assert.ok(out.includes('这是手写的描述段落，含 **粗体** 与 `行内代码`。'), '手写描述不得被改写');
  assert.ok(out.includes('beta 的手写描述。') && out.includes('尾部内容不该被动。'));
  assert.equal(injectReadme(out, records), out, '重复注入应幂等');
});

test('injectReadme: 未登记的段落保持原样', () => {
  const readme = '### [gamma](./gamma)\n\ngamma 描述。\n\n触发词：`gamma 词`。\n';
  const out = injectReadme(readme, [{ name: 'alpha', version: '1.0.0', triggers: ['x'] }]);
  assert.equal(out, readme, 'records 里没有的段落不应被触碰');
});
