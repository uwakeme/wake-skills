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
  ]);
});

test('extractAntiTriggers: 抽取「不要在以下情况使用」条目（readme-craft）', () => {
  const { fields } = parseFrontmatter(skillMd('readme-craft'));
  const a = extractAntiTriggers(fields.description);
  assert.ok(a.length >= 2, 'readme-craft 有两条反触发');
  assert.ok(a.some((x) => x.includes('CLAUDE.md')), '应含关于 CLAUDE.md 的那条');
  assert.ok(!a.some((x) => x.includes('→')), '应去掉箭头后的解释');
});

test('extractTriggersFromReadme: 从 article-valuator 段落抓反引号触发词', () => {
  const t = extractTriggersFromReadme(readme, 'article-valuator');
  assert.deepEqual(t, [
    '这篇文章值不值得读',
    '评估这个链接',
    '这篇文章有价值吗',
    '要不要收藏这篇',
    '这是不是软文',
    '看看这个有没有干货',
  ]);
});

test('extractTriggersFromReadme: 未登记的 skill 返回空数组', () => {
  assert.deepEqual(extractTriggersFromReadme(readme, 'no-such-skill'), []);
});
