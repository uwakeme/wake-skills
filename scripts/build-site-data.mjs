#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  parseFrontmatter, extractTriggersFromSkillMd,
  extractAntiTriggers, extractTriggersFromReadme, listReferences,
} from './lib/extract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const HOMEPAGE = join(REPO, 'docs', 'index.html');
const SKILLS_JSON = join(REPO, 'docs', 'skills.json');
const README = join(REPO, 'README.md');
const FALLBACK_REPO = { user: 'uwakeme', repo: 'wake-skills', branch: 'main' };

function gitOutput(args) {
  try {
    return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function parseGitHubUrl(remote) {
  const m = /(?:github\.com[:/])([^/]+)\/([^/.]+)/.exec(remote || '');
  return m ? { user: m[1], repo: m[2] } : { user: FALLBACK_REPO.user, repo: FALLBACK_REPO.repo };
}

/**
 * 发布分支：取 origin/HEAD，而不是本地检出的分支。
 * 在特性分支上跑 build 也不该把 /tree/<特性分支> 写进主页和安装命令——
 * 那些链接是要给公开访客点的，分支一合并就没了。
 */
function publishBranch() {
  const head = gitOutput(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  return head.replace(/^origin\//, '') || FALLBACK_REPO.branch;
}

/** 从 marketplace.json + SKILL.md + README 装配全部 skill 记录。 */
export function buildSkillRecords(repoRoot) {
  const warnings = [];
  const marketplace = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'marketplace.json'), 'utf8'));
  const readme = existsSync(join(repoRoot, 'README.md'))
    ? readFileSync(join(repoRoot, 'README.md'), 'utf8') : '';
  const { user, repo } = parseGitHubUrl(gitOutput(['remote', 'get-url', 'origin']));
  const base = `https://github.com/${user}/${repo}`;
  const branch = publishBranch();

  const records = [];
  for (const entry of marketplace.plugins ?? []) {
    const name = entry.name;
    const dir = join(repoRoot, name);
    if (!existsSync(dir)) {
      warnings.push(`marketplace 登记了 "${name}"，但目录 ${name}/ 不存在，已跳过`);
      continue;
    }
    for (const field of ['version', 'category', 'description_i18n']) {
      if (!entry[field]) warnings.push(`"${name}" 缺字段 ${field}，该字段留空`);
    }
    const mdPath = join(dir, 'SKILL.md');
    let triggers = [], triggerSource = 'none', antiTriggers = [];
    if (existsSync(mdPath)) {
      const { fields } = parseFrontmatter(readFileSync(mdPath, 'utf8'));
      // description 是保留换行的多行字符串，触发词/反触发都靠行首锚定，不要压平。
      const desc = fields.description ?? '';
      triggers = extractTriggersFromSkillMd(desc);
      if (triggers.length) {
        triggerSource = 'skill-md';
      } else {
        triggers = extractTriggersFromReadme(readme, name);
        if (triggers.length) triggerSource = 'readme';
      }
      antiTriggers = extractAntiTriggers(desc);
    } else {
      warnings.push(`"${name}" 没有 SKILL.md，触发词与反触发为空`);
    }
    records.push({
      name,
      version: entry.version ?? '',
      category: entry.category ?? '',
      keywords: entry.keywords ?? [],
      description: entry.description_i18n?.['zh-CN'] ?? entry.description ?? '',
      triggers,
      triggerSource,
      antiTriggers,
      references: listReferences(dir),
      url: `${base}/tree/${branch}/${name}`,
      installCmd: `mavis skill install ${base}/tree/${branch}/${name}`,
    });
  }

  // 孤儿检测：目录里有 SKILL.md 但 marketplace 未登记 —— 静默漏更新的头号来源
  for (const d of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('.')) continue;
    if (existsSync(join(repoRoot, d.name, 'SKILL.md')) && !records.some((r) => r.name === d.name)) {
      warnings.push(`孤儿 skill：${d.name}/ 有 SKILL.md 但未登记到 marketplace.json，主页不会显示它`);
    }
  }
  return { records, warnings };
}

/** 组装 skills.json 载荷。 */
export function buildSkillsJson(records) {
  return {
    generatedAt: new Date().toISOString(),
    repo: { ...FALLBACK_REPO },
    count: records.length,
    categories: [...new Set(records.map((r) => r.category).filter(Boolean))].sort(),
    skills: records,
  };
}

/**
 * 只在 <!-- auto:meta:count:begin/end --> 锚点区间内替换计数。
 * 没有锚点就原样返回并 ok=false：绝不用无锚点的全文件正则去改主页。
 */
export function injectMeta(html, count) {
  const re = /(<!-- auto:meta:count:begin -->)([\s\S]*?)(<!-- auto:meta:count:end -->)/;
  if (!re.test(html)) return { html, ok: false };
  const block = html.match(re)[2].replace(/\d+ 个技能/g, `${count} 个技能`);
  return { html: html.replace(re, `$1${block}$3`), ok: true };
}

/** 只改 README 各 skill 段落的标题行（名称+版本）与「触发词：」行，其余一字不动。 */
export function injectReadme(readme, records) {
  let out = readme;
  for (const r of records) {
    // 标题行必须行内锚定：\s* 会跨过换行把描述段落的第一个词吃掉，
    // 那等于改写手写段落。只吞标题行自己的尾巴（旧版本号），并用函数式
    // 替换避免版本号里的 $ 被当成替换模式。
    const head = new RegExp(`(###\\s*\\[${r.name}\\]\\([^)]*\\))[^\\S\\n]*[^\\n]*`);
    if (head.test(out)) {
      out = out.replace(head, (_m, g1) => `${g1} \`v${r.version}\``);
    }
    const segRe = new RegExp(
      `(###\\s*\\[${r.name}\\]\\([^)]*\\)[\\s\\S]*?)(?=\\n###\\s|\\n##\\s|$)`,
    );
    const seg = out.match(segRe);
    if (!seg) continue;
    const line = r.triggers.length
      ? `触发词：${r.triggers.map((t) => `\`${t}\``).join('、')}。`
      : '';
    const body = line
      ? seg[0].replace(/\n触发词：[^\n]*/, `\n${line}`)
      : seg[0].replace(/\n触发词：[^\n]*/, '');
    out = out.replace(seg[0], body);
  }
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const { records, warnings } = buildSkillRecords(REPO);
  const payload = buildSkillsJson(records);
  const jsonText = `${JSON.stringify(payload, null, 2)}\n`;
  const html = readFileSync(HOMEPAGE, 'utf8');
  const injected = injectMeta(html, records.length);
  if (!injected.ok) warnings.push('index.html 缺少 <!-- auto:meta:count:begin/end --> 锚点，meta 数字未更新');
  // 告警在锚点检查之后再打印，否则这条会被漏掉（静默失败比没有校验更糟）。
  for (const w of warnings) console.warn(`  告警: ${w}`);
  const readmeOut = injectReadme(readFileSync(README, 'utf8'), records);
  const targets = [
    [SKILLS_JSON, jsonText],
    [HOMEPAGE, injected.html],
    [README, readmeOut],
  ];
  let drift = 0;
  for (const [file, text] of targets) {
    const cur = existsSync(file) ? readFileSync(file, 'utf8') : null;
    const norm = (s) => (s === null ? s : s.replace(/"generatedAt": "[^"]*"/, '"generatedAt": ""'));
    if (norm(cur) === norm(text)) continue;
    drift += 1;
    if (check) { console.error(`漂移: ${file}`); continue; }
    writeFileSync(file, text);
    console.log(`  已更新: ${file}`);
  }
  console.log(`${records.length} 个 skill：`);
  for (const r of records) console.log(`  - ${r.name} v${r.version} [${r.category}] 触发来源=${r.triggerSource} 触发词=${r.triggers.length}`);
  if (check && drift) { console.error(`${drift} 处漂移，跑 npm run build 同步`); process.exit(1); }
}

if (process.argv[1] && process.argv[1].endsWith('build-site-data.mjs')) main();
