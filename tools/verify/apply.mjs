#!/usr/bin/env node
// Áp dụng báo cáo kiểm chứng (docs/verification/**/*.yml) lên verification của mục theo quy tắc EDITORIAL §3.
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { ROOT } from '../gate/lib/paths.mjs';
import { loadEntries } from '../gate/lib/load.mjs';
import { loadReports } from './lib/reports.mjs';
import { planApply, writeChanges } from './lib/apply.mjs';

const HELP = `Áp dụng báo cáo kiểm chứng — Cẩm nang sinh tồn

Dùng: node tools/verify/apply.mjs [tùy chọn]
  --dry-run          (mặc định) chỉ in thay đổi dự kiến
  --write            ghi verification.* vào frontmatter mục (giữ nguyên byte còn lại)
  --content DIR      Thư mục nội dung (mặc định $CONTENT_DIR hoặc "content")
  --reports DIR      Thư mục báo cáo (mặc định docs/verification)
  --allow-imported   cho phép nâng cả mục chưa rewritten
  --json             in kết quả JSON
  -h, --help         Trợ giúp
`;
const { values: a } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
    content: { type: 'string' },
    reports: { type: 'string' },
    'allow-imported': { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});
if (a.help) {
  console.log(HELP);
  process.exit(0);
}
if (a.write && a['dry-run']) {
  console.error('--write và --dry-run loại trừ nhau');
  process.exit(2);
}
const contentDir = resolve(ROOT, a.content ?? process.env.CONTENT_DIR ?? 'content');
const reportsDir = resolve(ROOT, a.reports ?? 'docs/verification');
const entries = await loadEntries(contentDir);
const reports = await loadReports(reportsDir);
const plan = planApply({ entries, reports, allowImported: a['allow-imported'] });

let written = [];
if (a.write) written = await writeChanges(plan.changes, (p) => readFile(p, 'utf8'));

if (a.json) {
  const strip = ({ abs, ...c }) => c;
  console.log(JSON.stringify({ mode: a.write ? 'write' : 'dry-run', reports: reports.length, changes: plan.changes.map(strip), kept: plan.kept, skipped: plan.skipped, written }, null, 2));
} else {
  console.log(`Áp dụng báo cáo kiểm chứng (${a.write ? 'GHI' : 'dry-run'}): ${reports.length} báo cáo, ${plan.changes.length} thay đổi, ${plan.kept.length} giữ nguyên, ${plan.skipped.length} báo cáo bị từ chối\n`);
  if (plan.changes.length) {
    console.log('Thay đổi:');
    for (const c of plan.changes) console.log(`  ${c.id}\n    ${c.from} → ${c.to}   [${c.reason}]\n    báo cáo: ${c.reports.join('; ')}`);
    console.log('');
  }
  if (plan.kept.length) {
    console.log('Giữ nguyên:');
    for (const k of plan.kept) console.log(`  ${k.id} (${k.status}): ${k.reason}`);
    console.log('');
  }
  if (plan.skipped.length) {
    console.log('Báo cáo bị từ chối (không có tác dụng):');
    for (const s of plan.skipped) {
      console.log(`  ${s.file}${s.id ? ` (${s.id})` : ''}`);
      for (const r of s.reasons) console.log(`    - ${r}`);
    }
    console.log('');
  }
  if (a.write) console.log(`Đã ghi ${written.length} mục.`);
  else if (plan.changes.length) console.log('Chạy lại với --write để ghi.');
}
