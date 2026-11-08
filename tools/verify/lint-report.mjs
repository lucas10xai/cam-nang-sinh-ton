#!/usr/bin/env node
// Kiểm báo cáo kiểm chứng YAML đúng khuôn docs/EDITORIAL.md §3.
import { parseArgs } from 'node:util';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../gate/lib/paths.mjs';
import { loadEntries } from '../gate/lib/load.mjs';
import { entryHash } from './lib/hash.mjs';
import { loadReports, VERDICTS, RESULTS, IN_FORCE, SEVERITIES, REPORT_KEYS } from './lib/reports.mjs';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const nonEmpty = (s) => typeof s === 'string' && s.trim() !== '';

function validHttpUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Kiểm một báo cáo đã parse. entriesById: Map id → entry (từ loadEntries); null = không kiểm tồn tại.
 * Trả [{ level: 'error'|'warn', message }].
 */
export function lintReport(rep, { entriesById = null } = {}) {
  const out = [];
  const err = (m) => out.push({ level: 'error', message: m });
  const warn = (m) => out.push({ level: 'warn', message: m });
  if (rep.parseError || !rep.data) {
    err(rep.parseError ?? 'Báo cáo rỗng');
    return out;
  }
  const r = rep.data;

  for (const k of Object.keys(r)) if (!REPORT_KEYS.includes(k)) warn(`Khóa lạ "${k}" (không thuộc khuôn EDITORIAL §3)`);

  if (!nonEmpty(r.id)) err('Thiếu id');
  else {
    if (entriesById && !entriesById.has(r.id)) err(`id "${r.id}" không tồn tại trong content`);
    if (rep.file && basename(rep.file).replace(/\.ya?ml$/, '') !== r.id) warn(`Tên file không khớp id "${r.id}"`);
  }
  if (!nonEmpty(r.checker)) err('Thiếu checker');
  if (typeof r.checked_at !== 'string' || !DATE.test(r.checked_at)) err('checked_at phải là chuỗi YYYY-MM-DD');
  if (!RESULTS.includes(r.result)) err(`result phải thuộc ${RESULTS.join(' | ')}`);

  if (typeof r.content_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(r.content_sha256)) {
    err('Thiếu hoặc sai content_sha256 (64 ký tự hex; lấy bằng `node tools/verify/hash.mjs <file mục>`)');
  } else if (entriesById && entriesById.has(r.id)) {
    try {
      if (entryHash(entriesById.get(r.id).raw) !== r.content_sha256) warn('content_sha256 ≠ hash hiện tại của mục (mục đã đổi sau khi kiểm: báo cáo lạc hậu)');
    } catch {
      /* frontmatter hỏng: gate báo */
    }
  }

  if (!Array.isArray(r.claims) || r.claims.length === 0) err('claims phải là danh sách không rỗng');
  else {
    r.claims.forEach((c, i) => {
      const p = `claims[${i + 1}]`;
      if (!c || typeof c !== 'object') return err(`${p} không phải đối tượng`);
      if (!nonEmpty(c.text)) err(`${p}: thiếu text`);
      if (!validHttpUrl(c.source_url)) err(`${p}: source_url không phải URL http(s) hợp lệ`);
      if (!VERDICTS.includes(c.verdict)) err(`${p}: verdict "${c.verdict}" không hợp lệ (${VERDICTS.join(' | ')})`);
      if ((c.verdict === 'match' || c.verdict === 'match-secondary') && !nonEmpty(c.quote)) err(`${p}: verdict ${c.verdict} nhưng quote rỗng`);
      if (c.note !== undefined && typeof c.note !== 'string') err(`${p}: note phải là chuỗi`);
    });
    if (r.result === 'pass' && r.claims.some((c) => c?.verdict !== 'match')) warn('result=pass nhưng có khẳng định không phải "match"');
  }

  if (!Array.isArray(r.internal_checks)) err('internal_checks phải là danh sách (có thể rỗng)');
  else {
    r.internal_checks.forEach((c, i) => {
      if (!c || !nonEmpty(c.issue)) err(`internal_checks[${i + 1}]: thiếu issue`);
      if (!c || !SEVERITIES.includes(c.severity)) err(`internal_checks[${i + 1}]: severity phải là error | warn`);
    });
  }

  const v = r.validity;
  if (!v || typeof v !== 'object' || Array.isArray(v)) err('Thiếu khối validity');
  else {
    if (!nonEmpty(v.doc)) err('validity.doc rỗng');
    if (!IN_FORCE.includes(v.in_force)) err('validity.in_force phải là true | false | unconfirmed');
    if (!nonEmpty(v.basis)) warn('validity.basis rỗng (nêu bằng chứng cho in_force)');
  }

  for (const k of ['potential_harm', 'suggested_edits', 'deliberate_vn_deviation']) {
    if (r[k] === undefined) {
      if (k === 'potential_harm') warn('Thiếu potential_harm (dùng [] nếu không có)');
    } else if (!Array.isArray(r[k])) err(`${k} phải là danh sách`);
  }
  return out;
}

export async function lintAll({ reportsDir, contentDir }) {
  const entries = await loadEntries(contentDir);
  const entriesById = new Map(entries.filter((e) => e.data?.id).map((e) => [e.data.id, e]));
  const reports = await loadReports(reportsDir);
  return reports.map((rep) => ({ file: rep.file, issues: lintReport(rep, { entriesById }) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values: a, positionals } = parseArgs({
    options: { content: { type: 'string' }, reports: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
  if (a.help) {
    console.log('Dùng: node tools/verify/lint-report.mjs [--content DIR] [--reports DIR] [file.yml ...]\nMặc định kiểm mọi docs/verification/**/*.yml. Exit 1 nếu có lỗi.');
    process.exit(0);
  }
  const contentDir = resolve(ROOT, a.content ?? process.env.CONTENT_DIR ?? 'content');
  const reportsDir = resolve(ROOT, a.reports ?? 'docs/verification');
  let results = await lintAll({ reportsDir, contentDir });
  if (positionals.length) {
    const want = positionals.map((p) => resolve(p));
    const all = await loadReports(reportsDir);
    const keep = new Set(all.filter((r) => want.includes(r.abs)).map((r) => r.file));
    results = results.filter((r) => keep.has(r.file));
    if (results.length === 0) {
      console.error('Không thấy báo cáo nào khớp (file phải nằm trong thư mục báo cáo).');
      process.exit(2);
    }
  }
  let errors = 0;
  let warns = 0;
  for (const r of results) {
    for (const i of r.issues) {
      i.level === 'error' ? errors++ : warns++;
      console.log(`${i.level === 'error' ? 'LỖI ' : 'CẢNH BÁO'}  ${r.file}: ${i.message}`);
    }
  }
  console.log(`Báo cáo: ${results.length}, ${errors} lỗi, ${warns} cảnh báo → ${errors ? 'KHÔNG ĐẠT' : 'ĐẠT'}`);
  process.exit(errors ? 1 : 0);
}
