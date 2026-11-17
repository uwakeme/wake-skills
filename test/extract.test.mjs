import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseFrontmatter,
  extractTriggersFromSkillMd,
  extractAntiTriggers,
  extractTriggersFromReadme,
} from '../scripts/lib/extract.mjs';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const skillMd = (name) =>
  readFileSync(new URL(`../${name}/SKILL.md`, import.meta.url), 'utf8');

test('parseFrontmatter: 折叠块标量 description 并分离正文', () => {
  const md = skillMd('readme-craft');
  const { fields, body } = parseFrontmatter(md);
  assert.equal(fields.name, 'readme-craft');
  assert.equal(fields.risk, 'safe');
  assert.ok(fields.description.includes('生成标准化'), '块标量应折叠为单段');
  assert.ok(fields.description.includes('触发：'), '多行 description 应拼接');
  assert.ok(body.startsWith('# readme-craft'), '正文应从一级标题开始');
});

test('extractTriggersFromSkillMd: 直引号规范写法（readme-craft）', () => {
  const { fields } = parseFrontmatter(skillMd('readme-craft'));
  const t = extractTriggersFromSkillMd(fields.description);
  assert.ok(t.includes('生成 README'));
  assert.ok(t.includes('写一份 README'));
  assert.ok(t.includes('补项目文档'));
});

test('extractTriggersFromSkillMd: 弯引号「」写法（readme-banner）', () => {
  const { fields } = parseFrontmatter(skillMd('readme-banner'));
  const t = extractTriggersFromSkillMd(fields.description);
  assert.ok(t.includes('生成 README banner'));
  assert.ok(t.includes('hero 图'));
});

test('extractTriggersFromSkillMd: 散文式（article-valuator）只取第一个句号前的触发词', () => {
  const { fields } = parseFrontmatter(skillMd('article-valuator'));
  const t = extractTriggersFromSkillMd(fields.description);
  // 句号之后的 "评估"、"要不要看 / 学 / 收藏这篇文章" 属散文说明，不是触发词。
  // 本例同时覆盖引号内跨行去换行：源文件里第 3、6 条各断了一次行。
  assert.deepEqual(t, [
    '帮我看看这篇文章值不值得读/学',
    '评估一下这个链接',
    '这个文章有价值吗',
    '这篇文章值得花时间吗',
    '帮我分析一下这篇的含金量',
    '看看要不要收藏这篇',
  ]);
});

test('extractTriggersFromSkillMd: 规范列表超过 7 条（changelog-craft）应全部保留', () => {
  const { fields } = parseFrontmatter(skillMd('changelog-craft'));
  const t = extractTriggersFromSkillMd(fields.description);
  assert.deepEqual(t, [
    '生成 CHANGELOG',
    '写 changelog',
    '更新更新日志',
    '这个版本改了啥',
    '整理 release notes',
    '提交',
    'commit',
    '帮我提交这些改动',
  ]);
});

test('extractTriggersFromSkillMd: 规范列表超过 7 条（homepage-craft）应全部保留', () => {
  const { fields } = parseFrontmatter(skillMd('homepage-craft'));
  const t = extractTriggersFromSkillMd(fields.description);
  assert.deepEqual(t, [
    '给项目生成主页',
    '做一个 landing page',
    '生成项目官网',
    'GitHub Pages 首页',
    'project homepage',
    '把 README 变成网页',
    '开源项目展示页',
    '给我的库做个介绍页',
    '把主页部署上线',
    '主页地址加到 README',
    '设置仓库 Website',
  ]);
});

test('extractAntiTriggers: 抽取「不要在以下情况使用」条目（readme-craft）', () => {
  const { fields } = parseFrontmatter(skillMd('readme-craft'));
  const a = extractAntiTriggers(fields.description);
  assert.ok(a.length >= 2, 'readme-craft 有两条反触发');
  assert.ok(a.some((x) => x.includes('CLAUDE.md')), '应含关于 CLAUDE.md 的那条');
  assert.ok(!a.some((x) => x.includes('→')), '应去掉箭头后的解释');
});

test('extractTriggersFromSkillMd: 中文弯引号 “ ” 与直引号一样能抓出触发词', () => {
  // 字符类里必须真的含 U+201C/U+201D；曾经被 normalize 成两个直引号，
  // 弯引号写法的 SKILL.md 会静默解析出 0 条。
  const desc = '触发：“生成 README”、“写一份 README”。后面是散文说明。';
  assert.deepEqual(extractTriggersFromSkillMd(desc), ['生成 README', '写一份 README']);
});

test('extractAntiTriggers: 条目内部含箭头时按最后一个箭头切，不截成残句（homepage-craft）', () => {
  const { fields } = parseFrontmatter(skillMd('homepage-craft'));
  const a = extractAntiTriggers(fields.description);
  const ui = a.find((x) => x.includes('通用前端开发'));
  assert.ok(ui, '应含通用前端开发那条');
  assert.ok(ui.includes('这条流水线）'), '括号内的「仓库 → 主页」必须完整保留');
  assert.ok(!ui.includes('frontend-design'), '最后一个箭头后的解释应被去掉');
});

test('extractAntiTriggers: 无箭头的条目原样保留', () => {
  const desc = '不要在以下情况使用：\n- 只想摘要文章\n- 需要事实核查 → 用专门工具';
  assert.deepEqual(extractAntiTriggers(desc), ['只想摘要文章', '需要事实核查']);
});

test('extractTriggersFromReadme: 从 article-valuator 段落抓反引号触发词', () => {
  const t = extractTriggersFromReadme(readme, 'article-valuator');
  // README 的触发词行现由 scripts/build-site-data.mjs 从 SKILL.md 生成，
  // 此处断言的是「生成后的 README 仍是可回落解析的纯反引号列表」这一不变量。
  assert.deepEqual(t, [
    '帮我看看这篇文章值不值得读/学',
    '评估一下这个链接',
    '这个文章有价值吗',
    '这篇文章值得花时间吗',
    '帮我分析一下这篇的含金量',
    '看看要不要收藏这篇',
  ]);
});

test('extractTriggersFromReadme: 未登记的 skill 返回空数组', () => {
  assert.deepEqual(extractTriggersFromReadme(readme, 'no-such-skill'), []);
});

test('extractTriggersFromReadme: skill 名含正则元字符时按字面量匹配', () => {
  const md = '### [a.b|c](./a.b|c)\n\n描述。\n\n触发词：`命中`。\n';
  assert.deepEqual(extractTriggersFromReadme(md, 'a.b|c'), ['命中']);
  // 未转义时 `a.b|c` 会匹配到 `axb` 或 `c` 这类错误段落
  const other = '### [axb](./axb)\n\n触发词：`不该命中`。\n';
  assert.deepEqual(extractTriggersFromReadme(other, 'a.b|c'), []);
});
