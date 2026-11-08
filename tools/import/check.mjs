// Tự kiểm content/: frontmatter parse được bằng schema, đủ số mục, id/related hợp lệ, H2 đúng thứ tự.
// Chạy: node tools/import/check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { EntrySchema, BODY_SECTIONS, REQUIRED_BODY_SECTIONS } from '../../schema/entry.mjs';
import { ChapterSchema } from '../../schema/chapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONTENT = join(ROOT, 'content');
const errors = [];
const err = (m) => errors.push(m);

const split = (file) => {
  const t = readFileSync(file, 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('thiếu frontmatter');
  return { front: parse(m[1]), body: m[2] };
};

const chapterFiles = readdirSync(join(CONTENT, 'chapters')).sort();
if (chapterFiles.length !== 36) err(`số chương ${chapterFiles.length} ≠ 36`);
const chapters = new Map();
for (const f of chapterFiles) {
  try {
    const { front } = split(join(CONTENT, 'chapters', f));
    const r = ChapterSchema.safeParse(front);
    if (!r.success) err(`chapters/${f}: ${r.error.message}`);
    else chapters.set(r.data.number, r.data);
  } catch (e) {
    err(`chapters/${f}: ${e.message}`);
  }
}

const ids = new Set();
const pairs = new Set();
const entries = [];
let count = 0;
const perChapter = new Map();
for (const dir of readdirSync(join(CONTENT, 'entries')).sort()) {
  for (const f of readdirSync(join(CONTENT, 'entries', dir)).sort()) {
    const rel = `entries/${dir}/${f}`;
    count++;
    try {
      const { front, body } = split(join(CONTENT, rel));
      const r = EntrySchema.safeParse(front);
      if (!r.success) {
        err(`${rel}: ${r.error.message}`);
        continue;
      }
      const e = r.data;
      if (ids.has(e.id)) err(`${rel}: id trùng ${e.id}`);
      ids.add(e.id);
      const key = `${e.chapter}/${e.number}`;
      if (pairs.has(key)) err(`${rel}: (chapter, number) trùng ${key}`);
      pairs.add(key);
      if (!dir.startsWith(String(e.chapter).padStart(2, '0') + '-')) err(`${rel}: thư mục không khớp chapter ${e.chapter}`);
      if (!f.endsWith(`-${e.id}.md`)) err(`${rel}: tên file không khớp id`);
      const h2 = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
      const want = BODY_SECTIONS.filter((s) => h2.includes(s));
      if (REQUIRED_BODY_SECTIONS.some((s) => !h2.includes(s)) || h2.join('|') !== want.join('|')) err(`${rel}: H2 sai/thiếu/sai thứ tự: ${h2.join(', ')}`);
      perChapter.set(e.chapter, (perChapter.get(e.chapter) ?? 0) + 1);
      entries.push({ rel, e });
    } catch (x) {
      err(`${rel}: ${x.message}`);
    }
  }
}
for (const { rel, e } of entries) for (const r of e.related) if (!ids.has(r)) err(`${rel}: related trỏ id không tồn tại: ${r}`);
for (const [n, c] of chapters) if ((perChapter.get(n) ?? 0) !== c.entry_count) err(`chương ${n}: entry_count ${c.entry_count} ≠ số file ${perChapter.get(n) ?? 0}`);

// so với nguồn
const src = join(ROOT, '_ref', 'vi-quangpao', 'book');
let srcCount = 0;
for (const f of readdirSync(src).filter((x) => /^\d\d-.*\.md$/.test(x))) srcCount += readFileSync(join(src, f), 'utf8').split('\n').filter((l) => /^### \d+\. /.test(l)).length;
if (srcCount !== count) err(`số mục ${count} ≠ nguồn ${srcCount}`);

if (errors.length) {
  console.error(errors.slice(0, 50).join('\n'));
  console.error(`\n${errors.length} lỗi.`);
  process.exit(1);
}
console.log(`OK: ${chapters.size} chương, ${count} mục (nguồn ${srcCount}), frontmatter hợp lệ theo schema/entry.mjs.`);
