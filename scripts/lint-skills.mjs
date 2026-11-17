#!/usr/bin/env node
// lint —— 校验 skill 数据源之间的一致性（零依赖）。
// marketplace.json 是 skill 列表的唯一权威；各 plugin.json 与 SKILL.md frontmatter
// 必须与它对齐，否则 ZCode 安装看到的版本/描述会和主页脱节。
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkillRecords } from './build-site-data.mjs';
import { parseFrontmatter } from './lib/extract.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const marketplace = JSON.parse(readFileSync(join(REPO, '.claude-plugin', 'marketplace.json'), 'utf8'));
const { records, warnings } = buildSkillRecords(REPO);
const problems = [...warnings];

for (const entry of marketplace.plugins ?? []) {
  const dir = join(REPO, entry.name);
  if (!existsSync(dir)) continue; // 目录缺失已由 buildSkillRecords 告警

  const mdPath = join(dir, 'SKILL.md');
  if (existsSync(mdPath)) {
    const { fields } = parseFrontmatter(readFileSync(mdPath, 'utf8'));
    if (fields.name && fields.name !== entry.name) {
      problems.push(`${entry.name}: SKILL.md frontmatter name="${fields.name}" 与目录名不一致`);
    }
  }

  const pjPath = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(pjPath)) {
    problems.push(`${entry.name}: 缺 .claude-plugin/plugin.json`);
    continue;
  }
  const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
  if (pj.name !== entry.name) problems.push(`${entry.name}: plugin.json name="${pj.name}" 与 marketplace 不一致`);
  if (pj.version !== entry.version) problems.push(`${entry.name}: plugin.json version ${pj.version} ≠ marketplace ${entry.version}`);
  if (pj.description !== entry.description) problems.push(`${entry.name}: plugin.json description 与 marketplace 不同步`);
}

for (const r of records) {
  if (r.triggerSource === 'none') problems.push(`${r.name}: 触发词解析为 none（核对 SKILL.md 触发段格式）`);
}

if (problems.length) {
  for (const p of problems) console.error(`  lint: ${p}`);
  console.error(`${problems.length} 处问题`);
  process.exit(1);
}
console.log(`lint 通过：${records.length} 个 skill，name/version/description 与 marketplace 同步`);