import { readdir, readFile } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ROOT } from './paths.mjs';

export function splitFrontmatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const m = text.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { data: null, body: text, bodyStartLine: 1, error: 'Thiếu frontmatter YAML (---)' };
  const bodyStartLine = m[0].split('\n').length;
  try {
    const data = parseYaml(m[1]);
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, body: text.slice(m[0].length), bodyStartLine, error: 'Frontmatter không phải đối tượng YAML' };
    }
    return { data, body: text.slice(m[0].length), bodyStartLine, error: null };
  } catch (e) {
    return { data: null, body: text.slice(m[0].length), bodyStartLine, error: `YAML lỗi: ${e.message.split('\n')[0]}` };
  }
}

// Tách thân thành các H2 (bỏ qua dòng trong khối code ```).
export function splitSections(body) {
  const sections = [];
  let cur = null;
  let fenced = false;
  const lines = body.split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const m = !fenced && line.match(/^##[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (m && !line.startsWith('###')) {
      cur = { title: m[1].normalize('NFC'), lines: [], line: i + 1 };
      sections.push(cur);
    } else if (cur) {
      cur.lines.push(line);
    }
  });
  return sections.map((s) => ({ title: s.title, line: s.line, text: s.lines.join('\n').trim() }));
}

export function sectionText(entry, title) {
  const s = entry.sections.find((x) => x.title === title);
  return s ? s.text : null;
}

// Đọc mọi mục trong <contentDir>/entries/<NN-slug>/<MM-slug>.md
export async function loadEntries(contentDir) {
  const entriesDir = join(contentDir, 'entries');
  let dirs = [];
  try {
    dirs = (await readdir(entriesDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
  const entries = [];
  for (const dir of dirs) {
    const files = (await readdir(join(entriesDir, dir))).filter((f) => f.endsWith('.md')).sort();
    for (const f of files) {
      const abs = join(entriesDir, dir, f);
      const raw = await readFile(abs, 'utf8');
      const fm = splitFrontmatter(raw);
      const chDir = dir.match(/^(\d+)/);
      entries.push({
        file: relative(ROOT, abs),
        abs,
        raw,
        data: fm.data,
        body: fm.body,
        bodyStartLine: fm.bodyStartLine,
        parseError: fm.error,
        sections: splitSections(fm.body),
        chapterDir: chDir ? Number(chDir[1]) : null,
        idGuess: basename(f, '.md'),
      });
    }
  }
  return entries;
}

export function entryChapter(entry) {
  const c = entry.data?.chapter;
  return Number.isInteger(c) ? c : entry.chapterDir;
}
