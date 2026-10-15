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

/** marketplace.json 是手工可编辑的，skill 名直接拼进正则前必须转义，否则 `a|b` 会变成或分支。 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 只在 <!-- auto:meta:count:begin/end --> 锚点区间内替换计数。
 * 没有锚点就原样返回并 ok=false：绝不用无锚点的全文件正则去改主页。
 * 用函数式替换：锚点区间里一旦出现 $& / $1 / $`，字符串替换会把整段匹配复制回来。
 */
export function injectMeta(html, count) {
  const re = /(<!-- auto:meta:count:begin -->)([\s\S]*?)(<!-- auto:meta:count:end -->)/;
  if (!re.test(html)) return { html, ok: false };
  const block = html.match(re)[2].replace(/\d+ 个技能/g, `${count} 个技能`);
  return { html: html.replace(re, (_m, open, _inner, close) => `${open}${block}${close}`), ok: true };
}

/**
 * 首屏两处技能数量：eyebrow 的 #hero-skill-count 与 fm-card 的 #fm-skill-count。
 * 按 id 定点定位，不用行号也不用无锚点的大范围正则：
 *  - 行号会随骨架里的任何一次插入整体漂移；
 *  - 全文匹配「数字」会顺手动到 version、分类数这些手写文案。
 * 这两处在 meta 锚点区间之外，injectMeta 覆盖不到，只能单独注入。
 * 函数式替换：目标文本里出现 $& / $1 / $` 时，字符串替换会把整段匹配复制回来。
 * 定位不到就原样返回并把 id 记进 missing，交给 main 打告警——不抛异常、不改文件。
 */
export function injectHeroCount(html, count) {
  const slots = [
    ['hero-skill-count', `${count} skills`],
    ['fm-skill-count', String(count)],
  ];
  const missing = [];
  let out = html;
  for (const [id, text] of slots) {
    // 标签名回引 \2 逼着开闭标签配对；内层 [^<]* 保证只改紧邻的文本，不跨元素。
    const re = new RegExp(`(<([a-zA-Z][\\w-]*)[^>]*?\\sid="${id}"[^>]*>)([^<]*)(</\\2>)`);
    if (!re.test(out)) {
      missing.push(id);
      continue;
    }
    out = out.replace(re, (_m, open, _tag, _inner, close) => `${open}${text}${close}`);
  }
  return { html: out, ok: missing.length === 0, missing };
}

/**
 * 把技能数据内联进主页的 <script type="application/json" id="skill-data">。
 * 内联的意义：浏览器禁止 file:// 读取本地文件，若只靠 fetch，
 * 双击打开主页就看不到任何技能。放在 </body> 前是为了不阻塞首屏渲染。
 * JSON 内联在 script 标签里，唯一要防的是 </script> 提前闭合。
 */
export function injectInlineData(html, payload) {
  const re = /(<script type="application\/json" id="skill-data">)([\s\S]*?)(<\/script>)/;
  if (!re.test(html)) return { html, ok: false };
  // 换行+缩进是可读性考虑；</ 转义防止标签提前闭合
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  return {
    html: html.replace(re, (_m, open, _inner, close) => `${open}\n${json}\n${close}`),
    ok: true,
  };
}

/** 只改 README 各 skill 段落的标题行（名称+版本）与「触发词：」行，其余一字不动。 */
export function injectReadme(readme, records) {
  let out = readme;
  for (const r of records) {
    const key = escapeRegExp(r.name);
    // 标题行必须行内锚定：\s* 会跨过换行把描述段落的第一个词吃掉，
    // 那等于改写手写段落。只吞标题行自己的尾巴（旧版本号），并用函数式
    // 替换避免版本号里的 $ 被当成替换模式。
    const head = new RegExp(`(###\\s*\\[${key}\\]\\([^)]*\\))[^\\S\\n]*[^\\n]*`);
    if (head.test(out)) {
      out = out.replace(head, (_m, g1) => `${g1} \`v${r.version}\``);
    }
    const segRe = new RegExp(
      `(###\\s*\\[${key}\\]\\([^)]*\\)[\\s\\S]*?)(?=\\n###\\s|\\n##\\s|$)`,
    );
    const seg = out.match(segRe);
    if (!seg) continue;
    const line = r.triggers.length
      ? `触发词：${r.triggers.map((t) => `\`${t}\``).join('、')}。`
      : '';
    // 两处替换都必须是函数式：触发词里出现 $& / $` / $1 / $' 时，
    // 字符串替换会把整段匹配（连同手写描述）复制回结果，等于篡改手写段落。
    const body = line
      ? seg[0].replace(/\n触发词：[^\n]*/, () => `\n${line}`)
      : seg[0].replace(/\n触发词：[^\n]*/, '');
    out = out.replace(seg[0], () => body);
  }
  return out;
}

/** 写入时沿用原文件的主导行尾，避免注入的几行变成裸 LF、把文件搞成混合行尾。 */
export function withSameEol(original, text) {
  const crlf = (original.match(/\r\n/g) || []).length;
  const lf = (original.match(/(?<!\r)\n/g) || []).length;
  if (crlf <= lf) return text;
  return text.replace(/(?<!\r)\n/g, '\r\n');
}

/** 比对口径：排除每次都会变的 generatedAt，并把 CRLF 归一成 LF 后再比。 */
function sameContent(a, b) {
  // generatedAt 有两种写法：skills.json 是缩进过的（`"generatedAt": "…"`），
  // 主页内联的是压缩过的（`"generatedAt":"…"`），空格可省，两种都要覆盖。
  const norm = (s) => (s === null ? s : s
    .replace(/"generatedAt":\s*"[^"]*"/g, '"generatedAt":""')
    .replace(/\r\n/g, '\n'));
  return norm(a) === norm(b);
}

/**
 * 落盘 / 漂移检测的唯一出口。
 * check 模式只报告不写；build 模式写入并回报改了哪些。
 * targets 是 [绝对路径, 目标内容] 列表。
 */
export function applyTargets(targets, { check = false } = {}) {
  const drift = [];
  const updated = [];
  for (const [file, text] of targets) {
    const cur = existsSync(file) ? readFileSync(file, 'utf8') : null;
    if (sameContent(cur, text)) continue;
    drift.push(file);
    if (check) continue;
    writeFileSync(file, text);
    updated.push(file);
  }
  return { drift, updated };
}


function main() {
  const check = process.argv.includes('--check');
  const { records, warnings } = buildSkillRecords(REPO);
  const payload = buildSkillsJson(records);
  const jsonText = `${JSON.stringify(payload, null, 2)}\n`;
  const html = readFileSync(HOMEPAGE, 'utf8');
  const injected = injectMeta(html, records.length);
  if (!injected.ok) warnings.push('index.html 缺少 <!-- auto:meta:count:begin/end --> 锚点，meta 数字未更新');
  const counted = injectHeroCount(injected.html, records.length);
  for (const id of counted.missing) warnings.push(`index.html 找不到 id="${id}"，首屏技能数量未更新`);
  const inlined = injectInlineData(counted.html, payload);
  if (!inlined.ok) warnings.push('index.html 缺少 <script type="application/json" id="skill-data">，双击打开将看不到技能列表');
  // 告警在锚点检查之后再打印，否则这条会被漏掉（静默失败比没有校验更糟）。
  for (const w of warnings) console.warn(`  告警: ${w}`);
  const readmeSrc = readFileSync(README, 'utf8');
  // 注入的行一律用原文件的行尾，别把 README 写成混合行尾。
  const readmeOut = withSameEol(readmeSrc, injectReadme(readmeSrc, records));
  const targets = [
    [SKILLS_JSON, jsonText],
    [HOMEPAGE, withSameEol(html, inlined.html)],
    [README, readmeOut],
  ];
  const { drift, updated } = applyTargets(targets, { check });
  for (const f of updated) console.log(`  已更新: ${f}`);
  console.log(`${records.length} 个 skill：`);
  for (const r of records) console.log(`  - ${r.name} v${r.version} [${r.category}] 触发来源=${r.triggerSource} 触发词=${r.triggers.length}`);
  if (check) {
    for (const f of drift) console.error(`漂移: ${f}`);
    if (drift.length) { console.error(`${drift.length} 处漂移，跑 npm run build 同步`); process.exit(1); }
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-site-data.mjs')) main();
