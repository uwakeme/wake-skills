import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  buildSkillRecords,
  buildSkillsJson,
  injectMeta,
  injectReadme,
  applyTargets,
  withSameEol,
} from '../scripts/build-site-data.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(repoRoot, 'scripts', 'build-site-data.mjs');
const README_PATH = join(repoRoot, 'README.md');
const JSON_PATH = join(repoRoot, 'docs', 'skills.json');

/** 在系统临时目录里造一个 fixture 文件，返回其路径。 */
function fixture(name, content) {
  const file = join(mkdtempSync(join(tmpdir(), 'build-fixture-')), name);
  writeFileSync(file, content, 'utf8');
  return file;
}

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

// ---- fix round 1 ----

test('injectReadme: 触发词含 $& / $1 / $` / $\' 时手写描述逐字不变', () => {
  // 替换串里出现 $ 特殊模式会把整段匹配复制进结果，等于篡改手写描述
  const readme = [
    '### [alpha](./alpha) `v1.0.0`',
    '',
    '手写描述，含 $ 符号与 $& 字样。',
    '',
    '触发词：`旧`。',
    '',
  ].join('\n');
  const records = [{ name: 'alpha', version: '1.0.0', triggers: ['$& 危险', '$1 危险', '$` 危险', "$' 危险"] }];
  const out = injectReadme(readme, records);
  assert.equal(out.match(/### \[alpha\]/g).length, 1, '标题不得被复制成两份');
  assert.ok(out.includes('手写描述，含 $ 符号与 $& 字样。'), '手写描述必须逐字保留');
  for (const pat of ['$& 危险', '$1 危险', '$` 危险', "$' 危险"]) {
    assert.ok(out.includes(pat), `触发词应原样写入：${pat}`);
  }
  assert.equal(injectReadme(out, records), out, '重复注入应幂等');
});

test('injectMeta: 锚点区间内含 $ 时不被当替换模式，且重复注入幂等', () => {
  const html = [
    '<!-- auto:meta:count:begin -->',
    '共 $& 个技能 / 5 个技能',
    '<!-- auto:meta:count:end -->',
    '',
  ].join('\n');
  const one = injectMeta(html, 7);
  const two = injectMeta(one.html, 7);
  assert.equal(one.ok, true);
  assert.ok(one.html.includes('$&'), '区间里的 $& 应原样保留');
  assert.equal((one.html.match(/7 个技能/g) || []).length, 1, '只有数字那处被替换');
  assert.equal((one.html.match(/auto:meta:count:begin/g) || []).length, 1, '锚点注释不得被复制');
  assert.equal(two.html, one.html, '重复注入必须幂等');
});

test('injectReadme: skill 名含正则元字符时按字面量匹配', () => {
  const readme = [
    '### [alpha|beta](./alpha|beta)',
    '',
    '描述段落。',
    '',
    '触发词：`旧词`。',
    '',
  ].join('\n');
  const out = injectReadme(readme, [{ name: 'alpha|beta', version: '9.9.9', triggers: ['新词'] }]);
  assert.ok(out.includes('### [alpha|beta](./alpha|beta) `v9.9.9`'), '应命中真实标题，而不是 | 的另一支');
  assert.ok(out.includes('触发词：`新词`。'), '触发词行应被替换');
  assert.ok(out.includes('描述段落。'), '手写描述不应被动');
});

test('applyTargets: CRLF 文件与 LF 生成物不算漂移，check 模式不写文件', () => {
  const original = '# 标题\r\n\r\n正文行\r\n';
  const file = fixture('README.md', original);
  const res = applyTargets([[file, '# 标题\n\n正文行\n']], { check: true });
  assert.deepEqual(res.drift, [], 'CRLF/LF 差异不得判为漂移');
  assert.deepEqual(res.updated, []);
  assert.equal(readFileSync(file, 'utf8'), original, 'check 模式不得写文件');
});

test('applyTargets: 内容真变了要报漂移；check 不写，build 才写', () => {
  const original = '旧内容\n';
  const changed = '新内容\n';
  const file = fixture('notes.md', original);
  const checked = applyTargets([[file, changed]], { check: true });
  assert.deepEqual(checked.drift, [file], '应报漂移');
  assert.deepEqual(checked.updated, []);
  assert.equal(readFileSync(file, 'utf8'), original, 'check 模式不得改写文件');
  const built = applyTargets([[file, changed]], {});
  assert.deepEqual(built.drift, [file]);
  assert.deepEqual(built.updated, [file], 'build 模式应写文件');
  assert.equal(readFileSync(file, 'utf8'), changed);
});

test('applyTargets: 文件不存在算漂移（首次生成 skills.json）', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'build-fixture-')), 'skills.json');
  const res = applyTargets([[file, '{}\n']], { check: true });
  assert.deepEqual(res.drift, [file]);
});

test('applyTargets: 比对时排除 generatedAt，其余逐字节一致即干净', () => {
  const file = fixture('skills.json', '{\n  "generatedAt": "OLD",\n  "count": 5\n}\n');
  const res = applyTargets([[file, '{\n  "generatedAt": "NEW",\n  "count": 5\n}\n']], { check: true });
  assert.deepEqual(res.drift, [], '只有 generatedAt 不同应算干净');
  const real = applyTargets([[file, '{\n  "generatedAt": "NEW",\n  "count": 6\n}\n']], { check: true });
  assert.deepEqual(real.drift, [file], 'count 变了必须报漂移');
});

test('withSameEol: 写入时沿用原文件行尾，不产出混合行尾', () => {
  assert.equal(withSameEol('a\r\nb\r\n', 'x\ny\n'), 'x\r\ny\r\n', '原文件 CRLF → 生成物也 CRLF');
  assert.equal(withSameEol('a\nb\n', 'x\ny\n'), 'x\ny\n', '原文件 LF → 不要反向改成 CRLF');
});

test('withSameEol + injectReadme: CRLF README 注入后不产生裸 LF', () => {
  const readme = ['### [alpha](./alpha)', '', '描述。', '', '触发词：`旧`。', ''].join('\r\n');
  const out = withSameEol(readme, injectReadme(readme, [{ name: 'alpha', version: '1.0.0', triggers: ['新'] }]));
  assert.equal(out.match(/(?<!\r)\n/g), null, '不得混入裸 LF');
  assert.ok(out.includes('触发词：`新`。'));
});

test('--check 端到端：当前仓库无漂移、退出码 0，且不写任何文件', () => {
  const readmeBefore = readFileSync(README_PATH, 'utf8');
  const jsonBefore = readFileSync(JSON_PATH, 'utf8');
  const r = spawnSync(process.execPath, [SCRIPT, '--check'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(r.status, 0, `--check 应干净退出：\n${r.stdout}\n${r.stderr}`);
  assert.equal(readFileSync(README_PATH, 'utf8'), readmeBefore, 'check 不得改 README');
  assert.equal(readFileSync(JSON_PATH, 'utf8'), jsonBefore, 'check 不得改 skills.json');
});

