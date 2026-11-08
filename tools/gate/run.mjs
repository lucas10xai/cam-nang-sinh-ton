#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve, dirname } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { ROOT } from './lib/paths.mjs';
import { runGate } from './lib/gate.mjs';
import { buildStatus } from './lib/status.mjs';

const HELP = `Cổng chất lượng — Cẩm nang sinh tồn

Dùng: node tools/gate/run.mjs [tùy chọn]
  --content DIR    Thư mục nội dung (mặc định $CONTENT_DIR hoặc "content")
  --chapter N      Chỉ báo cáo mục của chương N
  --links          Kiểm tra link còn sống (chậm, cần mạng)
  --json           In kết quả dạng JSON
  --out FILE       Ghi thống kê vào FILE (thường data/status.json)
  --strict         Cảnh báo cũng làm exit code ≠ 0
  --no-cache       Bỏ cache link
  -h, --help       Trợ giúp
`;

// Không gọi process.exit() khi stdout còn dữ liệu chờ ghi (pipe bị cắt cụt): đợi flush rồi mới thoát.
async function exitAfterFlush(code) {
  process.exitCode = code;
  await Promise.all([process.stdout, process.stderr].map((s) => new Promise((r) => s.write('', r))));
  process.exit(code);
}
const { values: a } = parseArgs({
  options: {
    content: { type: 'string' },
    chapter: { type: 'string' },
    links: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    strict: { type: 'boolean', default: false },
    'no-cache': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});
if (a.help) {
  console.log(HELP);
  await exitAfterFlush(0);
}
let chapter = null;
if (a.chapter !== undefined) {
  chapter = Number(a.chapter);
  if (!Number.isInteger(chapter)) {
    console.error('--chapter phải là số nguyên');
    await exitAfterFlush(2);
  }
}
const contentDir = resolve(ROOT, a.content ?? process.env.CONTENT_DIR ?? 'content');
const result = await runGate({ contentDir, chapter, links: a.links, linkOptions: a['no-cache'] ? { noCache: true } : {} });
const { entries, issues } = result;

if (a.out) {
  const outFile = resolve(ROOT, a.out);
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(buildStatus(entries), null, 2) + '\n');
}

const errors = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');
const failed = errors.length > 0 || (a.strict && warns.length > 0);

if (a.json) {
  console.log(JSON.stringify({ ok: !failed, entries: entries.length, errors: errors.length, warnings: warns.length, schema: result.schemaSource, skipped: result.skipped, issues }, null, 2));
} else {
  const byCheck = new Map();
  for (const i of issues) {
    const s = byCheck.get(i.check) ?? { error: 0, warn: 0 };
    s[i.level]++;
    byCheck.set(i.check, s);
  }
  console.log(`Cổng chất lượng: ${entries.length} mục${chapter != null ? ` (báo cáo chương ${chapter})` : ''}, schema: ${result.schemaSource}`);
  if (result.skipped.length) console.log(`Bỏ qua (cần cờ): ${result.skipped.join(', ')}`);
  console.log('');
  const shown = issues.slice().sort((x, y) => (x.file ?? '').localeCompare(y.file ?? '') || x.level.localeCompare(y.level));
  for (const i of shown) console.log(`${i.level === 'error' ? 'LỖI ' : 'CẢNH BÁO'}  [${i.check}] ${i.file ?? '-'} (${i.id ?? '-'}): ${i.message}`);
  if (issues.length) console.log('');
  console.log('Tóm tắt theo kiểm tra:');
  const w = Math.max(12, ...result.checks.map((c) => c.name.length));
  for (const c of result.checks) {
    if (result.skipped.includes(c.name)) {
      console.log(`  ${c.name.padEnd(w)}  (bỏ qua)`);
      continue;
    }
    const s = byCheck.get(c.name) ?? { error: 0, warn: 0 };
    console.log(`  ${c.name.padEnd(w)}  lỗi ${String(s.error).padStart(4)}   cảnh báo ${String(s.warn).padStart(4)}   ${s.error + s.warn === 0 ? 'đạt' : ''}`);
  }
  console.log(`\nTổng: ${errors.length} lỗi, ${warns.length} cảnh báo → ${failed ? 'KHÔNG ĐẠT' : 'ĐẠT'}${a.strict ? ' (strict)' : ''}`);
  if (a.out) console.log(`Đã ghi thống kê: ${a.out}`);
}
await exitAfterFlush(failed ? 1 : 0);
