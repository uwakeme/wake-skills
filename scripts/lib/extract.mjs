import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TRIGGER_HEAD = /(^|\n)\s*触发(?:词|场景)?[：:]\s*/;
const QUOTED = /[""]([^""]{1,40})[""]|「([^」]{1,40})」/g;
// 触发列表在第一个全角句号处结束：句号之前是列举的触发词，句号之后是散文说明。
const SENTENCE_END = '。';

/**
 * 解析 --- 包裹的 frontmatter。
 * 块标量按缩进折叠为一个字符串，**保留换行**（刻意不压成单段）：
 * 触发词与反触发都按行首锚定匹配，压平会让 `触发词：` 失去行首位置。
 * 块标量内部的空行是合法 YAML，跳过而不终止。
 * 返回的 description 因此是多行文本，调用方需要单行时自行折叠。
 */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n*/.exec(text);
  if (!m) return { fields: {}, body: text };
  const fields = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, raw] = kv;
    if (raw === '|' || raw === '>' || raw === '|-' || raw === '>-') {
      const buf = [];
      let j = i + 1;
      for (; j < lines.length; j += 1) {
        // 块标量内部的空行是合法 YAML，跳过而非终止；
        // 保留换行拼接，因为触发词/反触发都按行首锚定匹配。
        if (lines[j].trim() === '') continue;
        if (/^ {2,}\S/.test(lines[j])) buf.push(lines[j].trim());
        else break;
      }
      fields[key] = buf.join('\n');
      i = j - 1;
    } else {
      fields[key] = raw.replace(/^["']|["']$/g, '');
    }
  }
  return { fields, body: text.slice(m[0].length) };
}

/**
 * 取触发段文字：触发行 → 反触发行（或第一个全角句号）为止，取不到返回空串。
 * 以句号作结构边界而非用条数上限：规范写法可以有很多条，散文才会在句号后继续
 * 夹带说明性引文，因此「句号前」既能保住长列表，又能切掉散文。
 */
function triggerSegment(description) {
  const start = TRIGGER_HEAD.exec(description);
  if (!start) return '';
  const rest = description.slice(start.index + start[0].length);
  const stop = rest.search(/不要在以下(?:情况|场景)(?:使用|)/);
  const seg = stop === -1 ? rest : rest.slice(0, stop);
  const end = seg.indexOf(SENTENCE_END);
  return end === -1 ? seg : seg.slice(0, end);
}

/** 从 SKILL.md description 抓触发词；引号内容跨行时去掉换行，保证单条可单行渲染。 */
export function extractTriggersFromSkillMd(description) {
  const seg = triggerSegment(description);
  if (!seg) return [];
  const out = [];
  for (const m of seg.matchAll(QUOTED)) {
    const v = (m[1] ?? m[2] ?? '').replace(/\r?\n\s*/g, '').trim();
    if (v) out.push(v);
  }
  return out;
}

/** 从 SKILL.md description 抓「不要在以下情况使用」条目，去掉箭头后的解释。 */
export function extractAntiTriggers(description) {
  const m = /不要在以下(?:情况|场景)[^：:\n]*[：:]([\s\S]*)/.exec(description);
  if (!m) return [];
  return m[1]
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*]\s*/, '').trim())
    .filter(Boolean)
    .map((l) => l.split('→')[0].trim())
    .filter(Boolean);
}

/** 从 README 中某个 skill 的段落抓「触发词：」行的反引号内容。 */
export function extractTriggersFromReadme(readme, skillName) {
  const section = new RegExp(
    // 段落到下一个同级/上级标题为止；m 标志下裸 $ 会匹配每一行行尾，
    // 故末尾分支用 $(?![\s\S]) 锚定真正的文件结尾。
    `^###\\s*\\[${skillName}\\]\\([^)]*\\)[\\s\\S]*?(?=\\n###\\s|\\n##\\s|$(?![\\s\\S]))`,
    'm',
  ).exec(readme);
  if (!section) return [];
  const line = section[0].split(/\r?\n/).find((l) => l.startsWith('触发词：'));
  if (!line) return [];
  return [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
}

/** 列 references 目录下的文件名；无目录返回空数组。 */
export function listReferences(skillDir) {
  const dir = join(skillDir, 'references');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
}
